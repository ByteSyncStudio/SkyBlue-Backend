import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";
import knex from "../config/knex.js";
import { v4 as uuidv4 } from "uuid";
import { SendEmail } from "../config/emailService.js";
import { getOrderPlacedEmailTemplate } from "../utils/emailTemplates.js";
import {
  fetchCartItems,
  getCategoryMappings,
  getDiscountCategories,
  getDiscountProducts,
  getDiscounts,
  getTierPrices,
} from "../utils/Helper.js";

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

  const [customer, customerRoles] = await Promise.all([
    knex("Customer").where({ Id: customerId }).select("Email").first(),
    knex("Customer_CustomerRole_Mapping")
      .where({ Customer_Id: customerId })
      .pluck("CustomerRole_Id"),
  ]);

  if (!customer) throw new Error("Customer not found.");
  if (customerRoles.length === 0) throw new Error("Customer roles not found.");

  // Fetch the store details
  const store = await knex("Store")
    .where({ Id: 3 })
    .select("Id", "Name")
    .first();
  if (!store) throw new Error("Store not found.");

  return await knex.transaction(async (trx) => {
    const cartItems = await fetchCartItems(customerId);
    if (cartItems.length === 0) throw new Error("No items in cart.");

    const productIds = cartItems.map((item) => item.ProductId);
    const categoryMappings = (await getCategoryMappings(productIds)) || [];
    const categoryIds =
      categoryMappings.map((mapping) => mapping.CategoryId) || [];
    const discountCategories = (await getDiscountCategories(categoryIds)) || [];
    const discountProductMappings =
      (await getDiscountProducts(productIds)) || [];

    const discountIds = [
      ...new Set([
        ...discountCategories.map((d) => d.Discount_Id),
        ...discountProductMappings.map((d) => d.Discount_Id),
      ]),
    ];
    const discounts = (await getDiscounts(discountIds)) || [];

    //console.log("Discountsssssssssssssssssssss:", discounts);

    const tierPrices = (await getTierPrices(productIds, customerRoles)) || [];
    const tierPriceMap = new Map();
    tierPrices.forEach((tierPrice) => {
      tierPriceMap.set(
        `${tierPrice.ProductId}-${tierPrice.CustomerRoleId}`,
        tierPrice.Price
      );
      console.log("tierPriceMap:", tierPriceMap);
    });

    const updatedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        // Filter applicable discounts for the current product
        const applicableDiscounts = [
          ...discounts.filter((d) =>
            discountProductMappings.some(
              (mapping) =>
                mapping.Product_Id === item.ProductId &&
                mapping.Discount_Id === d.Id
            )
          ),
          ...discounts.filter((d) =>
            discountCategories.some(
              (mapping) =>
                mapping.Category_Id ===
                  categoryMappings.find((cm) => cm.ProductId === item.ProductId)
                    ?.CategoryId && mapping.Discount_Id === d.Id
            )
          ),
        ];


        //console.log("ITEMS", item)

        // Calculate the maximum applicable discount
        const discountAmount = applicableDiscounts.reduce((acc, d) => {
          if (d.UsePercentage) {
            console.log("DISOCUNTAMOUNT", d.DiscountPercentage,acc, (d.DiscountPercentage / 100) * item.Price)
            return Math.max(acc, (d.DiscountPercentage / 100) * item.Price); // Apply percentage discount
          }
          return Math.max(acc, d.DiscountAmount || 0); // Apply fixed discount
        }, 0);
        

        // Apply the discount to the item price
        const discountedPrice = item.Price - discountAmount;

        // Find the tier price if applicable
        const price = customerRoles.reduce((acc, roleId) => {
          const tieredPrice = tierPriceMap.get(`${item.ProductId}-${roleId}`);
          return tieredPrice !== undefined ? Math.min(acc, tieredPrice) : acc;
        }, Infinity);

        // Resolve the final price, fallback to product price if no tier price is found
        const resolvedPrice = isFinite(price)
          ? Math.min(price, discountedPrice)
          : discountedPrice;

        return {
          ...item,
          Price: resolvedPrice,
        };
      })
    );

    const { totalPrice, taxAmount, finalPrice, taxRate } =
      await calculateTotalPriceWithTax(customerEmail, updatedCartItems);

    console.log(
      "totalPrice:",
      totalPrice,
      "taxAmount:",
      taxAmount,
      "finalPrice:",
      finalPrice,
      "taxRate:",
      taxRate
    );

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

    const specialDiscount = await trx("Discount")
      .where({ DiscountTypeId: 1 })
      .select("DiscountAmount")
      .first();

      console.log("specialDiscount", specialDiscount)

    const specialDiscountAmount = specialDiscount
      ? specialDiscount.DiscountAmount
      : 0;
    const finalPriceAfterSpecialDiscount = finalPrice - specialDiscountAmount;

    const [order] = await trx("Order")
      .insert({
        OrderGuid: uuidv4(),
        StoreId: store.Id,
        CustomerId: customerId,
        BillingAddressId: billingAddressId,
        ShippingAddressId: shippingAddressId,
        PickUpInStore: 0,
        OrderStatusId: 10,
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
        OrderDiscount: specialDiscountAmount,
        OrderTotal: finalPriceAfterSpecialDiscount,
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

    await trx("Order").where({ Id: order.Id }).update({
      CustomOrderNumber: order.Id,
    });

    const orderItems = await Promise.all(
      updatedCartItems.map(async (item) => {
        const product = await trx("Product")
          .where({ Id: item.ProductId })
          .select("Name", "ProductCost", "BoxQty")
          .first();

        const unitPriceExclTax =
          product.BoxQty && product.BoxQty > 0
            ? item.Price / product.BoxQty
            : item.Price;

        const unitPriceInclTax = unitPriceExclTax * (1 + taxRate / 100);

        const [orderItem] = await trx("OrderItem")
          .insert({
            OrderItemGuid: uuidv4(),
            OrderId: order.Id,
            ProductId: item.ProductId,
            Quantity: item.Quantity,
            UnitPriceInclTax: unitPriceInclTax,
            UnitPriceExclTax: unitPriceExclTax,
            PriceInclTax: item.Quantity * unitPriceInclTax,
            PriceExclTax: item.Quantity * unitPriceExclTax,
            DiscountAmountInclTax: 0,
            DiscountAmountExclTax: 0,
            OriginalProductCost: item.Price,
            AttributeDescription: "",
            AttributesXml: "",
            DownloadCount: 0,
            IsDownloadActivated: 0,
            ItemWeight: 0,
            RentalStartDateUtc: null,
            RentalEndDateUtc: null,
          })
          .returning("*");

          // Update the product stock
          await updateProductStock(item.ProductId, item.Quantity);


        return {
          ...orderItem,
          ProductName: product.Name,
        };
      })
    );

    console.log("Inserted Order Items:", orderItems);

    // Delete items from the shopping cart
    await trx("ShoppingCartItem")
      .where({ CustomerId: customerId })
      .del();

    // Send order placed email
    const orderData = {
      order,
      orderItems,
      customerEmail,
    };
    const emailTemplate = await getOrderPlacedEmailTemplate(orderData);
    await SendEmail(customerEmail, 'Order Placed', emailTemplate);

    

    return {
      order,
      orderItems,
    };
  });
}

export { createCheckoutOrder };


async function updateProductStock(productId, quantity) {
  try {
    // Fetch the TrackInventoryMethod for the given product
    const product = await knex("Product")
      .where({ Id: productId })
      .select("ManageInventoryMethodId", "StockQuantity")
      .first();

      console.log("PRODUCT", product)

    if (!product) {
      throw new Error("Product not found.");
    }

    // Check the TrackInventoryMethod
    if (product.ManageInventoryMethodId === 1) {
      // Update the stock quantity
      const newStockQuantity = product.StockQuantity - quantity;
      await knex("Product")
        .where({ Id: productId })
        .update({ StockQuantity: newStockQuantity });

      console.log(`Updated stock quantity for productsssssssssssssssssssssssssssssssss ${productId}: ${newStockQuantity}`);
    } else {
      console.log(`TrackInventoryMethod is 0 for product ${productId}, no stock update needed.`);
    }
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw new Error("Failed to update product stock.");
  }
}