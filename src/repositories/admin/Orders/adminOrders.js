import knex from "../../../config/knex.js";
import { generateImageUrl2 } from "../../../utils/imageUtils.js";
import { v4 as uuidv4 } from 'uuid';

export async function listOrders(startDate, endDate, orderStatusId, page = 1, size = 20) {
  try {
    const offset = (page - 1) * size;

    let query = knex("dbo.Order")
      .select(
        "Id",
        "OrderGuid",
        "CustomerId",
        "OrderStatusId",
        "OrderTotal",
        "CreatedonUtc"
      )
      .orderBy("CreatedonUtc", "desc")

    if (startDate || endDate) {
      if (startDate) {
        query.where('CreatedOnUTC', '>=', startDate.toISOString())
      }
      if (endDate) {
        query.where('CreatedOnUTC', '<=', endDate.toISOString());
      }
    }

    if (orderStatusId) {
      query.where('OrderStatusId', orderStatusId)
    }

    query.offset(offset).limit(size);

    const orders = await query;

    // Extract CustomerIds from orders and flatten the array
    const customerIds = orders.map((order) => order.CustomerId).flat();

    // Remove duplicate CustomerIds
    const uniqueCustomerIds = [...new Set(customerIds)];

    // Fetch customer emails using the unique CustomerIds
    const customers = await knex("dbo.Customer as c")
      .join("dbo.Address as a", "c.Email", "a.Email")
      .whereIn("c.Id", uniqueCustomerIds)
      .select("c.Id", "c.Email", "a.FirstName", "a.LastName");

    // Map customer emails and store name to orders
    const ordersWithDetails = orders.map((order) => {
      const customer = customers.find((cust) => cust.Id === order.CustomerId);
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
    const order = await knex("dbo.Order as o")
      .where("o.Id", orderId)
      .select(
        "o.Id",
        "o.OrderGuid",
        "o.CustomerId",
        "o.OrderStatusId",
        "o.OrderTotal",
        "o.CreatedonUtc",
        "o.OrderTax",
        "o.OrderDiscount",
        "o.OrderSubtotalInclTax", // Include OrderSubtotalInclTax
        "o.OrderSubtotalExclTax", // Include OrderSubtotalExclTax
        "o.ShippingMethod",
        "oi.OrderItemGuid",
        "oi.ProductId",
        "oi.Quantity",
        "oi.UnitPriceInclTax",
        "oi.UnitPriceExclTax",
        "oi.PriceInclTax",
        "oi.PriceExclTax",
        "p.Name as ProductName",
        "p.VendorId",
        "p.ItemLocation", // Include ItemLocation from Product table
        "p.Barcode",
        "p.Barcode2",
        "v.Name as VendorName",
        "pic.MimeType",
        "pic.SeoFilename",
        "pic.Id as PictureId"
      )
      .leftJoin("dbo.OrderItem as oi", "o.Id", "oi.OrderId")
      .leftJoin("dbo.Product as p", "oi.ProductId", "p.Id") // Join with Product table
      .leftJoin("dbo.Vendor as v", "p.VendorId", "v.Id") // Join with Vendor table
      .leftJoin("dbo.Product_Picture_Mapping as ppm", "p.Id", "ppm.ProductId") // Join with Picture Mapping
      .leftJoin("dbo.Picture as pic", "ppm.PictureId", "pic.Id"); // Join with Picture table

    if (!order || order.length === 0) {
      return { success: false, message: "Order not found." };
    }

    // Group order items by ProductId
    const orderItemsWithProductDetails = [];
    const seenProducts = new Set();

    order.forEach((item) => {
      if (seenProducts.has(item.ProductId)) return;
      seenProducts.add(item.ProductId);

      const imageUrl = item.PictureId
        ? generateImageUrl2(item.PictureId, item.MimeType, item.SeoFilename)
        : "";

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
          vendorName: item.VendorName ? item.VendorName : "No vendor found",
        },
      });
    });

    // Fetch customer email
    const customer = await knex("dbo.Customer")
      .join("dbo.Address", "dbo.Customer.Email", "dbo.Address.Email")
      .join(
        "dbo.StateProvince",
        "dbo.Address.StateProvinceId",
        "dbo.StateProvince.Id"
      )
      .where({ "dbo.Customer.Id": order[0].CustomerId })
      .select(
        "dbo.Address.Email",
        "dbo.Address.Company",
        "dbo.Address.PhoneNumber",
        "dbo.Address.FirstName",
        "dbo.Address.LastName",
        "dbo.Address.Address1",
        "dbo.Address.City",
        "dbo.Address.CountryId",
        "dbo.Address.ZipPostalCode",
        "dbo.StateProvince.Name",
        "dbo.Address.Company"
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
        OrderSubtotalInclTax: order[0].OrderSubtotalInclTax, // Include in response
        OrderSubtotalExclTax: order[0].OrderSubtotalExclTax, // Include in response
        items: orderItemsWithProductDetails,
        customerEmail: customer.Email,
        customerFirstName: customer.FirstName,
        customerLastName: customer.LastName,
        customerAddress: customer.Address1,
        customerCountry:
          customer.CountryId === 1
            ? "United States"
            : customer.CountryId === 2
              ? "Canada"
              : customer.CountryId,
        customerState: customer.Name,
        customerCity: customer.City,
        customerZip: customer.ZipPostalCode,
        customerPhone: customer.PhoneNumber,
        customerCompany: customer.Company[0],
      },
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return { success: false, message: "Failed to retrieve order." };
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const statusMapping = {
      10: "Pending",
      20: "Processing",
      30: "Completed",
      40: "Canceled",
    };

    if (![10, 20, 30, 40].includes(status)) {
      throw new Error("Invalid status value.");
    }

    // Ensure orderId is passed as an integer to Knex
    await knex("Order")
      .where({ Id: orderId })
      .update({ OrderStatusId: status });

    console.log(
      `Order status updated to ${statusMapping[status]} for Order ID ${orderId}`
    );

    // Insert a new note into the OrderNote table
    const noteMessage = `Order status updated to ${statusMapping[status]}`;
    await knex('OrderNote').insert({
      OrderId: orderId,
      Note: noteMessage,
      DownloadId: 0,
      DisplayToCustomer: 0,
      CreatedOnUtc: new Date(), // Current date/time
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function updatePriceTotal(orderId, updateData) {
  try {
    await knex("Order").where({ id: orderId }).update(updateData); // Directly pass the dynamic object to update query
  } catch (error) {
    throw new Error("Failed to update order total: " + error.message);
  }
}

export async function updateBillingInfo(
  customerId,
  firstName,
  lastName,
  email,
  phone,
  countryId,
  stateProvinceId,
  address1,
  address2,
  zipPostalCode,
  faxNumber,
  company
) {
  try {
    // Get the customer data
    const customer = await knex("Customer").where({ Id: customerId }).first();
    console.log("Customer info:", customer);

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Get the BillingAddress_Id for the customer
    const billingAddressId = customer.BillingAddress_Id;

    // Prepare the update object
    const updateData = {};

    if (firstName !== undefined) updateData.FirstName = firstName;
    if (lastName !== undefined) updateData.LastName = lastName;
    if (email !== undefined) updateData.Email = email;
    if (phone != null) updateData.PhoneNumber = phone; // Allow null or empty string
    if (countryId !== undefined) updateData.CountryId = countryId;
    if (stateProvinceId !== undefined)
      updateData.StateProvinceId = stateProvinceId;
    if (address1 !== undefined) updateData.Address1 = address1;
    updateData.Address2 = address2 !== undefined ? address2 : null; // Set to null if undefined
    if (zipPostalCode !== undefined) updateData.ZipPostalCode = zipPostalCode;
    if (faxNumber !== undefined) updateData.FaxNumber = faxNumber;

    console.log("Update Data:", updateData); // Log the update data

    // Only update if there are values to update
    if (Object.keys(updateData).length > 0) {
      await knex("Address").where({ Id: billingAddressId }).update(updateData);
    } else {
      console.log("No fields to update in Address");
    }

    // Update the company in the Customer table if provided
    if (company !== undefined) {
      await knex("Customer")
        .where({ Id: customerId })
        .update({ Company: company });
    }

    console.log(`Billing information updated for Customer ID ${customerId}`);
  } catch (error) {
    console.error("Error updating billing info:", error);
    throw error;
  }
}

export async function updateShippingMethod(orderId, shippingMethod) {
  try {
    // Check if the order exists
    const order = await knex("Order").where({ Id: orderId }).first();
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Fetch the current shipping method for comparison
    const currentShippingMethod = order.ShippingMethod;

    // Update the shipping method if it's different
    if (currentShippingMethod !== shippingMethod) {
      await knex("Order")
        .where({ Id: orderId })
        .update({ ShippingMethod: shippingMethod });

      console.log(`Shipping method updated to ${shippingMethod} for Order ID ${orderId}`);

      // Insert a new note into the OrderNote table
      const noteMessage = `Shipping method updated from ${currentShippingMethod} to ${shippingMethod}`;
      await knex('OrderNote').insert({
        OrderId: orderId,
        Note: noteMessage,
        DownloadId: 0, // No downloadable content associated
        DisplayToCustomer: 0, // Not visible to customers
        CreatedOnUtc: new Date(), // Current date/time for the note
      });

      console.log(`Order note created: ${noteMessage}`);
    } else {
      console.log(`Shipping method for Order ID ${orderId} remains unchanged.`);
    }

  } catch (error) {
    console.error("Error updating shipping method:", error);
    throw error;
  }
}

export async function updateOrderItem(orderItemId, updatedFields, orderId) {
  try {
    // Ensure orderItemId is an integer
    const id = parseInt(orderItemId, 10); // Convert to integer if needed

    // Update the order item in the database
    await knex("OrderItem")
      .where({ OrderId: orderId })
      .andWhere({ ProductId: orderItemId }) // Make sure Id is used correctly
      .update(updatedFields);
  } catch (error) {
    console.error("Error updating order item in the database:", error);
    throw error;
  }
}

export async function getCountriesAndStates(req, res) {
  try {
    const countries = await knex("Country").select("Id", "Name");
    const states = await knex("StateProvince").select(
      "Id",
      "CountryId",
      "Name"
    );

    res.status(200).json({
      success: true,
      data: {
        countries,
        states,
      },
    });
  } catch (error) {
    console.error("Error fetching countries and states:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries and states.",
    });
  }
}


export async function AddProductOrder(orderId, productId, customerId, quantity) {
  try {
    // Sanitize productId and orderId to remove any unexpected characters
    const sanitizedProductId = Number(productId.toString().replace(":", ""));
    const sanitizedOrderId = Number(orderId.toString().replace(":", ""));

    if (isNaN(sanitizedProductId) || isNaN(sanitizedOrderId)) {
      throw new Error("Invalid productId or orderId provided.");
    }

    console.log("orderId:", sanitizedOrderId, "productId:", sanitizedProductId, "customerId:", customerId, "quantity:", quantity);

    // Fetch all customer roles for the given customer ID
    const customerRolesQuery = await knex("Customer_CustomerRole_Mapping")
      .select("CustomerRole_Id")
      .where("Customer_Id", customerId);

    let unitPrice;

    if (customerRolesQuery.length) {
      const customerRoleIds = customerRolesQuery.map(role => role.CustomerRole_Id);
      console.log("customerRoleIds:", customerRoleIds);

      // Fetch the tier prices for the given product and customer roles
      const tierPrices = await knex("TierPrice")
        .select("*")
        .where("ProductId", sanitizedProductId)
        .whereIn("CustomerRoleId", customerRoleIds);

      if (tierPrices.length) {
        // If tier prices exist, use the first valid tier price
        unitPrice = tierPrices[0].Price;
        console.log("Tier price found:", unitPrice);
      }
    }

    // If no customer roles or no tier prices found, fallback to product price
    if (!unitPrice) {
      const productQuery = await knex("Product")
        .select("Price")
        .where("Id", sanitizedProductId)
        .first();

      if (!productQuery) {
        throw new Error("Product not found");
      }

      unitPrice = productQuery.Price;
      console.log("Product price:", unitPrice);
    }

    // Fetch the country and state/province for tax calculation
    const country = await knex("Country")
      .select("Id", "Name", "SubjectToVat")
      .where("Id", 2) // ID 2 corresponds to Canada
      .first();

    if (!country) {
      throw new Error("Country not found");
    }
    console.log("Country found:", country.Name);

    const stateProvince = await knex("StateProvince")
      .select("Id", "Name")
      .where("CountryId", country.Id)
      .andWhere("Name", "Ontario")
      .first();

    if (!stateProvince) {
      throw new Error("State/Province not found");
    }
    console.log("State/Province found:", stateProvince.Name);

    const taxRate = await knex("TaxRate")
      .select("Percentage")
      .where("CountryId", country.Id)
      .andWhere("StateProvinceId", stateProvince.Id)
      .first();

    if (!taxRate) {
      throw new Error("Tax rate not found");
    }
    console.log("Tax rate found:", taxRate.Percentage);

    // Calculate the total price with tax
    const taxAmount = (unitPrice * taxRate.Percentage) / 100;
    const priceInclTax = unitPrice + taxAmount;

    // Multiply price and tax by quantity
    const totalUnitPrice = unitPrice * quantity;
    const totalPriceInclTax = priceInclTax * quantity;

    console.log("Unit Price:", unitPrice);
    console.log("Tax Amount:", taxAmount);
    console.log("Price Incl. Tax:", priceInclTax);
    console.log("totalUnitPrice:", totalUnitPrice);

    // Generate a GUID for OrderItemGuid
    const orderItemGuid = uuidv4(); // Generates a unique GUID

    // Insert the product into OrderItem with tax applied
    await knex("OrderItem").insert({
      OrderItemGuid: orderItemGuid, // Include the generated GUID
      OrderId: sanitizedOrderId,
      ProductId: sanitizedProductId,
      Quantity: quantity, // Use the passed quantity
      UnitPriceInclTax: priceInclTax,
      UnitPriceExclTax: unitPrice,
      PriceInclTax: totalPriceInclTax,
      PriceExclTax: totalUnitPrice,
      DiscountAmountInclTax: 0,
      DiscountAmountExclTax: 0,
      OriginalProductCost: 0,
      DownloadCount: 0,
      IsDownloadActivated: 0,
      LicenseDownloadId: 0,
      ItemWeight: 0,

    });

    console.log("Product added to order successfully with tax");

  } catch (error) {
    console.log("Something went wrong while adding product to order:", error);
  }
}

