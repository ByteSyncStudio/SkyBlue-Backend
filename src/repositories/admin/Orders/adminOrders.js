import knex from "../../../config/knex.js";
import { generateImageUrl2 } from "../../../utils/imageUtils.js";

export async function listOrders() {
  try {
    // Fetch orders and order by CreatedonUtc in descending order
    const orders = await knex('dbo.Order')
      .select('Id', 'OrderGuid', 'CustomerId', 'OrderStatusId', 'OrderTotal', 'CreatedonUtc')
      .orderBy('CreatedonUtc', 'desc');

    // Extract CustomerIds from orders and flatten the array
    const customerIds = orders.map(order => order.CustomerId).flat();

    // Remove duplicate CustomerIds
    const uniqueCustomerIds = [...new Set(customerIds)];

    // Fetch customer emails using the unique CustomerIds
    const customers = await knex('dbo.Customer')
      .whereIn('Id', uniqueCustomerIds)
      .select('Id', 'Email');

    // Fetch store name where Id is 3
    const store = await knex('dbo.Store')
      .where('Id', 3)
      .select('Name')
      .first();

    // Map customer emails and store name to orders
    const ordersWithDetails = orders.map(order => {
      const customer = customers.find(cust => cust.Id === order.CustomerId);
      return {
        ...order,
        CustomerEmail: customer ? customer.Email : null,
        StoreName: store ? store.Name : null
      };
    });

    return ordersWithDetails;
  } catch (error) {
    console.error("Error fetching orders from database:", error);
    throw error;
  }
}

// Get a single order by ID
export async function getOrderById(orderId) {
  try {
    // Fetch the order details
    const order = await knex('dbo.Order')
      .where({ Id: orderId })
      .select('Id', 'OrderGuid', 'CustomerId', 'OrderStatusId', 'OrderTotal', 'CreatedonUtc')
      .first();
    
    if (!order) {
      return { success: false, message: "Order not found." };
    }

    // Fetch order items
    const orderItems = await knex('dbo.OrderItem')
      .where({ OrderId: orderId })
      .select('OrderItemGuid', 'OrderId', 'ProductId', 'Quantity', 'UnitPriceInclTax', 'UnitPriceExclTax', 'PriceInclTax', 'PriceExclTax');
    
    // Fetch product details for each order item
    const orderItemsWithProductDetails = await Promise.all(orderItems.map(async (item) => {
      const product = await knex('dbo.Product')
        .where({ Id: item.ProductId })
        .select('Id', 'Name', 'VendorId') // Ensure VendorId is selected
        .first();
      
      if (!product) {
        return { ...item, product: null, imageUrl: '', vendorName: '' };
      }

      // Fetch the image information for the product
      const picture = await knex('dbo.Product_Picture_Mapping')
        .where({ ProductId: item.ProductId })
        .select('PictureId')
        .first();

      const imageUrl = picture 
        ? generateImageUrl2(picture.PictureId, 'image/jpeg', product.SeoFilename) 
        : '';

      // Fetch the vendor name
      const vendor = await knex('dbo.Vendor')
        .where({ Id: product.VendorId })
        .select('Name')
        .first();

      return {
        ...item,
        product: {
          ...product,
          imageUrl,
          vendorName: vendor ? vendor.Name : 'No vendor found',
        },
      };
    }));

    // Fetch customer email
    const customer = await knex('dbo.Customer')
      .where({ Id: order.CustomerId })
      .select('Email')
      .first();

    return {
      success: true,
      order: {
        ...order,
        items: orderItemsWithProductDetails,
        customerEmail: customer ? customer.Email : 'No email found',
      },
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return { success: false, message: "Failed to retrieve order." };
  }
}