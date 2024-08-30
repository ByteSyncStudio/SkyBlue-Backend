import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";
import knex from "../config/knex.js";
import { v4 as uuidv4 } from "uuid";

async function createCheckoutOrder(
  customerId,
  customerEmail,
  shippingAddressId,
  billingAddressId,
  customerIps
) {
  const countryCurrencyData = {
    1: { currencyCode: "USD", currencyRate: 1.0 },
    2: { currencyCode: "CAD", currencyRate: 1.0 },
  };

  const [customer, customerRoles, discount] = await Promise.all([
    knex("Customer").where({ Id: customerId }).select("Email").first(),
    knex("Customer_CustomerRole_Mapping")
      .where({ Customer_Id: customerId })
      .pluck("CustomerRole_Id"),
    knex("Discount").where({ Id: 12 }).select("DiscountAmount").first(),
  ]);

  if (!customer) throw new Error("Customer not found.");
  if (customerRoles.length === 0) throw new Error("Customer roles not found.");

  return await knex.transaction(async (trx) => {
    const cartItems = await trx("ShoppingCartItem")
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .where({ "ShoppingCartItem.CustomerId": customerId })
      .select(
        "ShoppingCartItem.Quantity",
        "Product.Id as ProductId",
        "ShoppingCartItem.ShoppingCartTypeId"
      );

    if (cartItems.length === 0) throw new Error("No items in cart.");

    const tierPrices = await trx("TierPrice")
      .whereIn("CustomerRoleId", customerRoles)
      .whereIn(
        "ProductId",
        cartItems.map((row) => row.ProductId)
      )
      .select("ProductId", "CustomerRoleId", "Price");

    const tierPriceMap = new Map();
    tierPrices.forEach((tierPrice) => {
      tierPriceMap.set(
        `${tierPrice.ProductId}-${tierPrice.CustomerRoleId}`,
        tierPrice.Price
      );
    });

    // Resolve prices for each cart item
    const updatedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const price = customerRoles.reduce((acc, roleId) => {
          const tieredPrice = tierPriceMap.get(`${item.ProductId}-${roleId}`);
          return tieredPrice !== undefined ? Math.min(acc, tieredPrice) : acc;
        }, Infinity);

        const resolvedPrice = isFinite(price)
          ? price
          : await trx("Product")
              .where({ Id: item.ProductId })
              .select("Price")
              .first()
              .then((p) => p.Price);

        return {
          ...item,
          Price: resolvedPrice,
        };
      })
    );

    const { totalPrice, taxAmount, finalPrice, taxRate } =
      await calculateTotalPriceWithTax(customerEmail, updatedCartItems);

    //console.log("Updated Cart Items:", updatedCartItems); // Log the updated cart items

    const address = await trx("Address")
      .where({ Email: customerEmail })
      .select("CountryId")
      .first();

    if (!address) throw new Error("Address not found.");
    const currencyData = countryCurrencyData[address.CountryId];
    if (!currencyData)
      throw new Error("Currency data not found for the given country.");

    const shippingMethod = await trx("ShippingMethod")
      .where({ Id: cartItems[0].ShoppingCartTypeId })
      .select("Name")
      .first();

    if (!shippingMethod) {
      throw new Error(
        `Shipping method not found for ShoppingCartTypeId: ${cartItems[0].ShoppingCartTypeId}`
      );
    }

    const formattedTaxRates = `${taxRate.toFixed(4)}:${taxAmount.toFixed(2)};`;

    const [order] = await trx("Order")
      .insert({
        OrderGuid: uuidv4(),
        StoreId: 3,
        CustomerId: customerId,
        BillingAddressId: billingAddressId,
        ShippingAddressId: shippingAddressId,
        PickUpInStore: 0,
        OrderStatusId: 20,
        ShippingStatusId: 20,
        PaymentStatusId: 10,
        PaymentMethodSystemName: "Payments.CheckMoneyOrder",
        CustomerCurrencyCode: currencyData.currencyCode,
        CurrencyRate: currencyData.currencyRate,
        CustomerTaxDisplayTypeId: 10,
        OrderSubtotalInclTax: finalPrice,
        OrderSubtotalExclTax: totalPrice,
        OrderSubTotalDiscountInclTax: 0,
        OrderSubTotalDiscountExclTax: 0,
        OrderShippingInclTax: 0,
        OrderShippingExclTax: 0,
        PaymentMethodAdditionalFeeInclTax: 0,
        PaymentMethodAdditionalFeeExclTax: 0,
        TaxRates: formattedTaxRates,
        OrderTax: taxAmount,
        OrderDiscount: discount.DiscountAmount,
        OrderTotal: finalPrice,
        RefundedAmount: 0,
        CheckoutAttributeDescription: "",
        CustomerLanguageId: 1,
        AffiliateId: 0,
        CustomerIp: customerIps,
        AllowStoringCreditCardNumber: 0,
        CardType: "",
        CardName: "",
        CardNumber: "",
        MaskedCreditCardNumber: "",
        CardCvv2: "",
        CardExpirationMonth: "",
        CardExpirationYear: "",
        PaidDateUtc: null,
        ShippingMethod: shippingMethod.Name,
        ShippingRateComputationMethodSystemName: "Shipping.FixedOrByWeight",
        Deleted: 0,
        CreatedOnUtc: new Date(),
        CustomOrderNumber: "",
      })
      .returning("*");

    await trx("Order")
      .where({ Id: order.Id })
      .update({ CustomOrderNumber: order.Id });

    const orderItemsPromises = updatedCartItems.map(async (item) => {
      const product = await trx("Product")
        .where({ Id: item.ProductId })
        .select("BoxQty", "Price")
        .first();

      if (!product) {
        throw new Error(`Product not found for ProductId: ${item.ProductId}`);
      }

      const unitPriceExclTax =
        product.BoxQty === 0
          ? item.Price
          : item.Price / product.BoxQty / (1 + taxRate);
      const unitPriceInclTax = unitPriceExclTax * (1 + taxRate);
      const priceInclTax = unitPriceInclTax * item.Quantity;
      const priceExclTax = unitPriceExclTax * item.Quantity;

      console.log("Item", item);

      return trx("OrderItem").insert({
        OrderItemGuid: uuidv4(),
        OrderId: order.Id,
        ProductId: item.ProductId,
        Quantity: item.Quantity,
        UnitPriceInclTax: unitPriceInclTax,
        UnitPriceExclTax: unitPriceExclTax,
        PriceInclTax: priceInclTax,
        PriceExclTax: priceExclTax,
        DiscountAmountInclTax: 0,
        DiscountAmountExclTax: 0,
        OriginalProductCost: item.Price,
        AttributeDescription: "",
        AttributesXml: "",
        DownloadCount: 0,
        IsDownloadActivated: 0,
        LicenseDownloadId: null,
        ItemWeight: 0,
        RentalStartDateUtc: null,
        RentalEndDateUtc: null,
      });
    });

    await Promise.all(orderItemsPromises);

    // Remove items from the ShoppingCartItem table for the given customerId
    await trx("ShoppingCartItem").where({ CustomerId: customerId }).del();

    return order;
  });
}

export { createCheckoutOrder };
