import knex from "../config/knex.js";
import { v4 as uuidv4 } from "uuid";
import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";

async function createCheckoutOrder(
  customerId,
  shippingAddressId,
  billingAddressId,
  paymentDetails
) {
  return await knex.transaction(async (trx) => {
    // Retrieve customer email
    console.log('Retrieving customer email...');
    const customer = await trx("Customer")
      .where({ Id: customerId })
      .select("Email")
      .first();

    if (!customer) throw new Error("Customer not found.");
    const { Email } = customer;
    console.log('Customer email retrieved:', Email);

    // Retrieve customer roles
    console.log('Retrieving customer roles...');
    const customerRoles = await trx("Customer_CustomerRole_Mapping")
      .where({ Customer_Id: customerId })
      .pluck("CustomerRole_Id");
    console.log('Customer roles retrieved:', customerRoles);

    // Fetch cart items
    console.log('Fetching cart items...');
    const cartItems = await trx("ShoppingCartItem")
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .where({ "ShoppingCartItem.CustomerId": customerId })
      .select(
        "ShoppingCartItem.Quantity",
        "Product.Id as ProductId"
      );

    if (cartItems.length === 0) throw new Error("No items in cart.");
    console.log('Cart items retrieved:', cartItems);

    // Fetch tier prices for cart items
    console.log('Fetching tier prices...');
    const tierPrices = await trx("TierPrice")
      .whereIn("CustomerRoleId", customerRoles)
      .whereIn("ProductId", cartItems.map(row => row.ProductId))
      .select("ProductId", "CustomerRoleId", "Price");

    // Map tier prices to products
    const tierPriceMap = tierPrices.reduce((acc, tierPrice) => {
      const key = `${tierPrice.ProductId}-${tierPrice.CustomerRoleId}`;
      acc[key] = tierPrice.Price;
      return acc;
    }, {});
    console.log('Tier prices mapped:', tierPriceMap);

    // Calculate prices with tiered pricing
    console.log('Calculating prices with tiered pricing...');
    const updatedCartItems = await Promise.all(cartItems.map(async (row) => {
      const key = `${row.ProductId}-${customerRoles[0]}`;
      const tieredPrice = tierPriceMap[key];

      const price = tieredPrice ?? await trx("Product")
        .where({ Id: row.ProductId })
        .select("Price")
        .first()
        .then(p => p.Price);

      console.log(`ProductId: ${row.ProductId}, Quantity: ${row.Quantity}, Price: ${price}`);
      return {
        ProductId: row.ProductId,
        Quantity: row.Quantity,
        Price: price,
      };
    }));

    // Calculate total price, tax amount, and final price
    console.log('Calculating total price with tax...');
    const { totalPrice, taxAmount, finalPrice } =
      await calculateTotalPriceWithTax(Email, updatedCartItems);
    console.log('Total price:', totalPrice);
    console.log('Tax amount:', taxAmount);
    console.log('Final price:', finalPrice);

    const customOrderNumber = `Ord-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log('Generated custom order number:', customOrderNumber);

    // Retrieve address
    console.log('Retrieving address...');
    const address = await trx("Address")
      .where({ Email })
      .select("CountryId")
      .first();

    if (!address) throw new Error("Address not found.");
    console.log('Address retrieved:', address);

    const currency = "CAD"; //hardcoded for now
    console.log('Currency:', currency);

    // Retrieve discount
    console.log('Retrieving discount...');
    const discount = await trx("Discount")
      .where({ Id: 12 })
      .select("DiscountAmount")
      .first();
    console.log('Discount retrieved:', discount);

    // Retrieve shipping method
    console.log('Retrieving shipping method...');
    const cartItem = await trx("ShoppingCartItem")
      .where({ CustomerId: customerId })
      .first();

    const shippingMethod = await trx("ShippingMethod")
      .where({ Id: cartItem.ShoppingCartTypeId })
      .select("Name")
      .first();
    console.log('Shipping method retrieved:', shippingMethod);

    // Insert order
    console.log('Inserting order...');
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
        PaymentMethodSystemName: paymentDetails?.method,
        CustomerCurrencyCode: currency,
        CurrencyRate: 1,
        CustomerTaxDisplayTypeId: 10,
        VatNumber: "",
        OrderSubtotalInclTax: finalPrice,
        OrderSubtotalExclTax: totalPrice,
        OrderSubTotalDiscountInclTax: 0,
        OrderSubTotalDiscountExclTax: 0,
        OrderShippingInclTax: 0,
        OrderShippingExclTax: 0,
        PaymentMethodAdditionalFeeInclTax: 0,
        PaymentMethodAdditionalFeeExclTax: 0,
        TaxRates: "",
        OrderTax: taxAmount,
        OrderDiscount: discount.DiscountAmount,
        OrderTotal: finalPrice,
        RefundedAmount: 0,
        RewardPointsHistoryEntryId: null,
        CheckoutAttributeDescription: "",
        CheckoutAttributesXml: "",
        CustomerLanguageId: 1,
        AffiliateId: 0,
        CustomerIp: "",
        AllowStoringCreditCardNumber: 0,
        CardType: "",
        CardName: "",
        CardNumber: "",
        MaskedCreditCardNumber: "",
        CardCvv2: "",
        CardExpirationMonth: "",
        CardExpirationYear: "",
        AuthorizationTransactionId: "",
        AuthorizationTransactionCode: "",
        AuthorizationTransactionResult: "",
        CaptureTransactionId: "",
        CaptureTransactionResult: "",
        SubscriptionTransactionId: "",
        PaidDateUtc: null,
        ShippingMethod: shippingMethod?.Name || "",
        ShippingRateComputationMethodSystemName: "",
        CustomValuesXml: "",
        Deleted: 0,
        CreatedOnUtc: new Date(),
        CustomOrderNumber: "",
      })
      .returning("*");
    console.log('Order inserted:', order);


    // Update the CustomOrderNumber with the generated Id
await trx("Order")
.where({ Id: order.Id })
.update({ CustomOrderNumber: order.Id });

console.log('Order updated with CustomOrderNumber:', order.Id);

    // Insert order items
    console.log('Inserting order items...');
    for (const item of updatedCartItems) {
      const unitPriceExclTax = item.Price / (1 + taxAmount / totalPrice);
      const priceInclTax = item.Price * item.Quantity;
      const priceExclTax = unitPriceExclTax * item.Quantity;

      await trx("OrderItem").insert({
        OrderItemGuid: uuidv4(),
        OrderId: order.Id,
        ProductId: item.ProductId,
        Quantity: item.Quantity,
        UnitPriceInclTax: item.Price,
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
    }
    console.log('Order items inserted successfully.');

    return order;
  });
}

export { createCheckoutOrder };

//todo - add more functions to checkoutRepo.js
