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
    // Fetch the order details along with order items, product details, vendor names, and picture details
    const order = await knex('dbo.Order as o')
      .where('o.Id', orderId)
      .select(
        'o.Id',
        'o.OrderGuid',
        'o.CustomerId',
        'o.OrderStatusId',
        'o.OrderTotal',
        'o.CreatedonUtc',
        'oi.OrderItemGuid',
        'oi.ProductId',
        'oi.Quantity',
        'oi.UnitPriceInclTax',
        'oi.UnitPriceExclTax',
        'oi.PriceInclTax',
        'oi.PriceExclTax',
        'p.Name as ProductName',
        'p.VendorId',
        'v.Name as VendorName',
        'pic.MimeType',
        'pic.SeoFilename',
        'pic.Id as PictureId'
      )
      .leftJoin('dbo.OrderItem as oi', 'o.Id', 'oi.OrderId')
      .leftJoin('dbo.Product as p', 'oi.ProductId', 'p.Id')
      .leftJoin('dbo.Vendor as v', 'p.VendorId', 'v.Id')
      .leftJoin('dbo.Product_Picture_Mapping as ppm', 'p.Id', 'ppm.ProductId')
      .leftJoin('dbo.Picture as pic', 'ppm.PictureId', 'pic.Id');

    if (!order || order.length === 0) {
      return { success: false, message: "Order not found." };
    }

    // Group order items by ProductId
    const orderItemsWithProductDetails = [];
    const seenProducts = new Set();

    order.forEach(item => {
      if (seenProducts.has(item.ProductId)) return;
      seenProducts.add(item.ProductId);

      const imageUrl = item.PictureId
        ? generateImageUrl2(item.PictureId, item.MimeType, item.SeoFilename)
        : '';

      orderItemsWithProductDetails.push({
        OrderItemGuid: item.OrderItemGuid,
        ProductId: item.ProductId,
        Quantity: item.Quantity,
        UnitPriceInclTax: item.UnitPriceInclTax,
        UnitPriceExclTax: item.UnitPriceExclTax,
        PriceInclTax: item.PriceInclTax,
        PriceExclTax: item.PriceExclTax,
        product: {
          Id: item.ProductId,
          Name: item.ProductName,
          VendorId: item.VendorId,
          imageUrl,
          vendorName: item.VendorName ? item.VendorName : 'No vendor found',
        },
      });
    });

    // Fetch customer email
    const customer = await knex('dbo.Customer')
      .where({ Id: order[0].CustomerId })
      .select('Email')
      .first();

    return {
      success: true,
      order: {
        Id: order[0].Id,
        OrderGuid: order[0].OrderGuid,
        CustomerId: order[0].CustomerId,
        OrderStatusId: order[0].OrderStatusId,
        OrderTotal: order[0].OrderTotal,
        CreatedonUtc: order[0].CreatedonUtc,
        items: orderItemsWithProductDetails,
        customerEmail: customer ? customer.Email : 'No email found',
      },
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return { success: false, message: "Failed to retrieve order." };
  }
}