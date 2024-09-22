import knex from "../../../config/knex.js";
import { generateImageUrl2 } from "../../../utils/imageUtils.js";

export async function listOrders(size) {
  try {
    // Fetch orders and order by CreatedonUtc in descending order
    let query = knex('dbo.Order')
      .select('Id', 'OrderGuid', 'CustomerId', 'OrderStatusId', 'OrderTotal', 'CreatedonUtc')
      .orderBy('CreatedonUtc', 'desc');

    if (size) {
      query = query.limit(size);
    }

    const orders = await query;

    // Extract CustomerIds from orders and flatten the array
    const customerIds = orders.map(order => order.CustomerId).flat();

    // Remove duplicate CustomerIds
    const uniqueCustomerIds = [...new Set(customerIds)];

    // Fetch customer emails using the unique CustomerIds
    const customers = await knex('dbo.Customer as c')
      .join('dbo.Address as a', 'c.Email', 'a.Email')
      .whereIn('c.Id', uniqueCustomerIds)
      .select('c.Id', 'c.Email', 'a.FirstName', 'a.LastName');



    // Map customer emails and store name to orders
    const ordersWithDetails = orders.map(order => {
      const customer = customers.find(cust => cust.Id === order.CustomerId);
      return {
        ...order,
        CustomerEmail: customer ? customer.Email : null,
        CustomerFirstName: customer ? customer.FirstName : null,
        CustomerLastName: customer ? customer.LastName : null,
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
    // Fetch the order details along with order items, product details, vendor names, picture details, and item location
    const order = await knex('dbo.Order as o')
      .where('o.Id', orderId)
      .select(
        'o.Id',
        'o.OrderGuid',
        'o.CustomerId',
        'o.OrderStatusId',
        'o.OrderTotal',
        'o.CreatedonUtc',
        'o.OrderTax',
        'o.OrderDiscount',
        'o.ShippingMethod',
        'oi.OrderItemGuid',
        'oi.ProductId',
        'oi.Quantity',
        'oi.UnitPriceInclTax',
        'oi.UnitPriceExclTax',
        'oi.PriceInclTax',
        'oi.PriceExclTax',
        'p.Name as ProductName',
        'p.VendorId',
        'p.ItemLocation', // Include ItemLocation from Product table
        'p.Barcode',
        'p.Barcode2',
        'v.Name as VendorName',
        'pic.MimeType',
        'pic.SeoFilename',
        'pic.Id as PictureId'
      )
      .leftJoin('dbo.OrderItem as oi', 'o.Id', 'oi.OrderId')
      .leftJoin('dbo.Product as p', 'oi.ProductId', 'p.Id') // Join with Product table
      .leftJoin('dbo.Vendor as v', 'p.VendorId', 'v.Id') // Join with Vendor table
      .leftJoin('dbo.Product_Picture_Mapping as ppm', 'p.Id', 'ppm.ProductId') // Join with Picture Mapping
      .leftJoin('dbo.Picture as pic', 'ppm.PictureId', 'pic.Id'); // Join with Picture table

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
          ItemLocation: item.ItemLocation,
          Barcode: item.Barcode,
          Barcode2: item.Barcode2,
          imageUrl,
          vendorName: item.VendorName ? item.VendorName : 'No vendor found',
        },
      });
    });

    // Fetch customer email
    const customer = await knex('dbo.Customer')
  .join('dbo.Address', 'dbo.Customer.Email', 'dbo.Address.Email')
  .join('dbo.StateProvince', 'dbo.Address.StateProvinceId', 'dbo.StateProvince.Id')
  .where({ 'dbo.Customer.Id': order[0].CustomerId })
  .select(
    'dbo.Address.Email',
    'dbo.Address.Company',
    'dbo.Address.PhoneNumber',
    'dbo.Address.FirstName',
    'dbo.Address.LastName',
    'dbo.Address.Address1',
    'dbo.Address.City',
    'dbo.Address.CountryId',
    'dbo.Address.ZipPostalCode',
    'dbo.StateProvince.Name',
    'dbo.Address.Company'
  )
  .first();

    return {
      success: true,
      order: {
        Id: order[0].Id,
        OrderGuid: order[0].OrderGuid,
        CustomerId: order[0].CustomerId,
        OrderStatusId: order[0].OrderStatusId,
        OrderTotal: order[0].OrderTotal,
        OrderTax: order[0].OrderTax,
        OrderDiscount: order[0].OrderDiscount,
        ShippingMethod: order[0].ShippingMethod,
        CreatedonUtc: order[0].CreatedonUtc,
        items: orderItemsWithProductDetails,
        customerEmail: customer.Email,
        customerFirstName: customer.FirstName,
        customerLastName: customer.LastName,
        customerAddress: customer.Address1,
        customerCountry: customer.CountryId === 1 ? "United States" : customer.CountryId === 2 ? "Canada" : customer.CountryId,
        customerState: customer.Name,
        customerCity: customer.City,
        customerZip: customer.ZipPostalCode,
        customerPhone: customer.PhoneNumber,
        customerCompany: customer.Company[0]
      },
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return { success: false, message: "Failed to retrieve order." };
  }
}
