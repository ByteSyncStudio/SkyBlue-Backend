// import knex from "../config/knex.js";
// import { v4 as uuidv4 } from "uuid";
// import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";

// async function createCheckoutOrder(
//   customerId,
//   shippingAddressId,
//   paymentDetails
// ) {
//   return await knex.transaction(async (trx) => {
//     // Fetch the customer's email based on customerId
//     const customer = await trx("Customer")
//       .where({ Id: customerId })
//       .select("Email")
//       .first();

//     if (!customer) throw new Error("Customer not found.");
//     const { Email } = customer;

//     // Fetch cart items along with product prices
//     const cartItems = await trx("ShoppingCartItem")
//       .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
//       .where({ "ShoppingCartItem.CustomerId": customerId })
//       .select(
//         "ShoppingCartItem.Quantity",
//         "Product.Id as ProductId",
//         "Product.Price"
//       )
//       .then((rows) =>
//         rows.map((row) => ({
//           ProductId: row.ProductId,
//           Quantity: row.Quantity,
//           Price: row.Price,
//         }))
//       );

//     if (cartItems.length === 0) throw new Error("No items in cart.");

//     // Calculate total price with tax using the customer's email
//     const { totalPrice, taxAmount, finalPrice } =
//       await calculateTotalPriceWithTax(Email, cartItems);

//     // Generate a CustomOrderNumber
//     const customOrderNumber = `ORDER-${Date.now()}`;

//     // Define a default StoreId or fetch it from somewhere
//     const storeId = 1; // Replace with the actual default StoreId or fetch it from your settings
//     // Log the values
//     console.log(
//       `CustomOrderNumber: "${customOrderNumber}", StoreId: "${storeId}", CustomerId: "${customerId}", ShippingAddressId: "${shippingAddressId}", TotalPrice: "${totalPrice}", TaxAmount: "${taxAmount}", FinalPrice: "${finalPrice}", PaymentDetails: "${paymentDetails?.method}"`
//     );

//     // Insert Order
//     const [order] = await trx("Order")
//       .insert({
//         OrderGuid: uuidv4(),
//         StoreId: storeId, // Added StoreId
//         CustomerId: customerId,
//         ShippingAddressId: shippingAddressId,
//         OrderSubtotalInclTax: totalPrice,
//         OrderTax: taxAmount,
//         OrderTotal: finalPrice,
//         PaymentMethodSystemName: paymentDetails?.method,
//         OrderStatusId: 1, // Set initial order status
//         CreatedOnUtc: new Date(),
//         CustomOrderNumber: customOrderNumber,
//       })
//       .returning("*");

//     // Insert OrderItems
//     for (const item of cartItems) {
//       await trx("OrderItem").insert({
//         OrderId: order.Id,
//         ProductId: item.ProductId,
//         Quantity: item.Quantity,
//         UnitPriceInclTax: item.Price,
//         PriceInclTax: item.Price * item.Quantity,
//       });
//     }

//     // Commit transaction
//     return order;
//   });
// }

// export { createCheckoutOrder };

import knex from "../config/knex.js";
import { v4 as uuidv4 } from "uuid";
import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";

async function createCheckoutOrder(customerId, shippingAddressId, billingAddressId, paymentDetails) {
  console.log("billingAddressId:", billingAddressId); // Debug output
  return await knex.transaction(async (trx) => {
    // Fetch the customer's email based on customerId
    const customer = await trx("Customer")
      .where({ Id: customerId })
      .select("Email")
      .first();
    console.log("customerId from Repo", customerId);

    if (!customer) throw new Error("Customer not found.");
    const { Email } = customer;

    // Fetch cart items along with product prices
    const cartItems = await trx("ShoppingCartItem")
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .where({ "ShoppingCartItem.CustomerId": customerId })
      .select("ShoppingCartItem.Quantity", "Product.Id as ProductId", "Product.Price")
      .then(rows => rows.map(row => ({
        ProductId: row.ProductId,
        Quantity: row.Quantity,
        Price: row.Price,
      })));

    if (cartItems.length === 0) throw new Error("No items in cart.");

    // Calculate total price with tax using the customer's email
    const { totalPrice, taxAmount, finalPrice } = await calculateTotalPriceWithTax(Email, cartItems);

    // Generate a CustomOrderNumber
    const customOrderNumber = `ORDER-${Date.now()}`;

    // Define a default StoreId or fetch it from somewhere
    const storeId = 3; // Replace with the actual default StoreId or fetch it from your settings

    // Log the values
    console.log(`CustomOrderNumber: "${customOrderNumber}", StoreId: "${storeId}", CustomerId: "${customerId}", ShippingAddressId: "${shippingAddressId}", BillingAddressId: "${billingAddressId}", TotalPrice: "${totalPrice}", TaxAmount: "${taxAmount}", FinalPrice: "${finalPrice}", PaymentDetails: "${paymentDetails?.method}", "customerId": "${customerId}"`);

    // Insert Order

    const [order] = await trx("Order")
      .insert({
        OrderGuid: uuidv4(),
        StoreId: storeId, // Added StoreId
        CustomerId: customerId,
        
        ShippingAddressId: shippingAddressId,
        BillingAddressId: billingAddressId, // Added BillingAddressId
        OrderSubtotalInclTax: finalPrice,
        OrderSubtotalExclTax: totalPrice,
        OrderShippingInclTax: 0,
        OrderShippingExclTax: 0,
        OrderTax: taxAmount,
        OrderTotal: finalPrice,
        CustomerLanguageId: 1,
        AffiliateId: 0,
        Deleted: 0,
        AllowStoringCreditCardNumber: 0,
        OrderSubTotalDiscountInclTax: 0,
        OrderSubTotalDiscountExclTax: 0,
        PaymentMethodAdditionalFeeInclTax: 0,
        PaymentMethodAdditionalFeeExclTax: 0,
        RefundedAmount: 0,
        OrderDiscount: 1.1900,
        PaymentMethodSystemName: paymentDetails?.method,
        OrderStatusId: 1, // Set initial order status
        CreatedOnUtc: new Date(),
        CustomOrderNumber: customOrderNumber,
        PickUpInStore: 0,
        ShippingStatusId: 10,
        PaymentStatusId: 10,
        CurrencyRate: 1,
        CustomerTaxDisplayTypeId: 10,
      })
      .returning("*");

    // Insert OrderItems
    for (const item of cartItems) {
      await trx("OrderItem").insert({
        OrderId: order.Id,
        ProductId: item.ProductId,
        Quantity: item.Quantity,
        UnitPriceInclTax: item.Price,
        PriceInclTax: item.Price * item.Quantity,
      });
    }

    // Commit transaction
    return order;
  });
}

export { createCheckoutOrder };
