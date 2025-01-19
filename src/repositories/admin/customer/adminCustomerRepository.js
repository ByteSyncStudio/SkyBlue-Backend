import moment from "moment";
import knex from "../../../config/knex.js";

export async function GetAllCustomersWithRoles(
  page = 1,
  pageSize = 25,
  email = "",
  firstName = "",
  lastName = "",
  phoneNumber = ""
) {
  try {
    const offset = (page - 1) * pageSize;

    // Subquery to get the latest address for each customer
    const latestAddressSubquery = knex("Address")
      .select("Email")
      .max("Id as LatestAddressId")
      .groupBy("Email")
      .as("LatestAddress");

    // Main query to get customers with their latest address
    let customerQuery = knex("Customer")
      .join(latestAddressSubquery, "Customer.Email", "LatestAddress.Email")
      .join("Address", function () {
        this.on("Address.Email", "=", "Customer.Email").andOn(
          "Address.Id",
          "=",
          "LatestAddress.LatestAddressId"
        );
      })
      .whereNotNull("Customer.Email")
      .where("IsApproved", 1);

    if (email) {
      customerQuery = customerQuery.andWhere(
        "Customer.Email",
        "like",
        `%${email}%`
      );
    }
    if (firstName) {
      customerQuery = customerQuery.andWhere(
        "Address.FirstName",
        "like",
        `%${firstName}%`
      );
    }
    if (lastName) {
      customerQuery = customerQuery.andWhere(
        "Address.LastName",
        "like",
        `%${lastName}%`
      );
    }
    if (phoneNumber) {
      customerQuery = customerQuery.andWhere(
        "Address.PhoneNumber",
        "like",
        `%${phoneNumber}%`
      );
    }

    // Get total count of customers
    const totalCustomers = await customerQuery
      .clone()
      .countDistinct("Customer.Id as count")
      .first();
    const totalPages = Math.ceil(totalCustomers.count / pageSize);

    const customers = await customerQuery
      .select(
        "Customer.Id",
        "Customer.Email",
        "Customer.Active",
        "Customer.CreatedOnUTC",
        "Address.FirstName",
        "Address.LastName",
        "Address.Company",
        "Address.PhoneNumber",
        "Address.ZipPostalCode"
      )
      .orderBy("Customer.CreatedOnUTC", "desc")
      .offset(offset)
      .limit(pageSize);

    // Now get the roles for these customers
    const customerIds = customers.map((c) => c.Id);
    const roles = await knex("Customer_CustomerRole_Mapping")
      .join(
        "CustomerRole",
        "Customer_CustomerRole_Mapping.CustomerRole_Id",
        "CustomerRole.Id"
      )
      .whereIn("Customer_CustomerRole_Mapping.Customer_Id", customerIds)
      .select(
        "Customer_CustomerRole_Mapping.Customer_Id",
        "CustomerRole.Id as RoleId",
        "CustomerRole.Name as RoleName"
      );

    // Merge roles into customers
    const customersWithRoles = customers.map((customer) => ({
      id: customer.Id,
      email: customer.Email,
      createdOnUTC: moment(customer.CreatedOnUTC).format("DD-MMM-YYYY"),
      firstName: customer.FirstName,
      lastName: customer.LastName,
      company: customer.Company,
      phone: customer.PhoneNumber,
      zip: customer.ZipPostalCode,
      active: customer.Active,
      roles: roles
        .filter((role) => role.Customer_Id === customer.Id)
        .map((role) => ({
          id: role.RoleId,
          name: role.RoleName,
        })),
    }));

    return {
      totalCustomers: totalCustomers.count,
      totalPages: totalPages,
      pageNumber: parseInt(page),
      data: customersWithRoles,
    };
  } catch (error) {
    console.error(error);
    error.statusCode = 500;
    error.message = "Error getting users.";
    throw error;
  }
}

export async function GetCustomerRoles() {
  try {
    return await knex("CustomerRole").select(["Id", "Name"]);
  } catch (error) {
    console.error(error);
    error.statusCode = 500;
    error.message = "Error getting roles.";
    throw error;
  }
}

export async function GetCustomerByOrderTotal(
  sortBy,
  startDate,
  endDate,
  page,
  size
) {
  try {
    const offset = (page - 1) * size;

    let orderClause;

    switch (sortBy) {
      case "order_total":
        orderClause = "OrderTotal desc";
        break;

      case "order_count":
        orderClause = "TotalOrders desc";
        break;

      default:
        orderClause = "OrderTotal desc";
        break;
    }

    let query = knex("Order as o")
      .leftJoin("Customer as c", "o.CustomerId", "c.Id")
      .select([
        "o.CustomerId",
        "c.Email",
        knex.raw("COUNT(*) OVER() AS total_count"),
      ])
      .sum("o.OrderSubtotalInclTax as OrderTotal")
      .count("o.Id as TotalOrders")
      .max("o.CreatedOnUTC as LastOrderDate")
      .groupBy("o.CustomerId", "c.Email");

    if (startDate || endDate) {
      if (startDate) {
        query.where("o.CreatedOnUTC", ">=", startDate.toISOString());
      }
      if (endDate) {
        query = query.where("o.CreatedOnUTC", "<=", endDate.toISOString());
      }
    }

    query = query.orderByRaw(orderClause).offset(offset).limit(size);

    query = await query;

    const totalItems = query.length > 0 ? query[0].total_count : 0;
    const totalPages = Math.ceil(totalItems / size);

    const orders = query.map(({ total_count, ...order }) => order);

    return {
      totalItems,
      totalPages,
      currentPage: page,
      data: orders,
    };
  } catch (error) {
    console.error(error);
    error.statusCode = 500;
    error.message = "Error getting roles.";
    throw error;
  }
}

export async function GetSingleCustomer(customerId) {
  try {
    // Fetch customer details without roles
    const customerDetails = await knex("Customer")
      .join("Address", "Customer.BillingAddress_Id", "Address.Id")
      .select(
        "Customer.Id",
        "Customer.Username",
        "Customer.Email",
        "Customer.Active",
        "Customer.CreatedOnUtc",
        "Address.FirstName",
        "Address.LastName",
        "Address.Company",
        "Address.CountryId",
        "Address.StateProvinceId",
        "Address.City",
        "Address.Address1",
        "Address.Address2",
        "Address.ZipPostalCode",
        "Address.PhoneNumber"
      )
      .where("Customer.Id", customerId)
      .first();
    
      console.log("Customer Details:", customerDetails);

    // Fetch customer roles separately
    const roles = await knex("Customer_CustomerRole_Mapping as ccrm")
      .join("CustomerRole as cr", "ccrm.CustomerRole_Id", "cr.Id")
      .select("cr.Id", "cr.Name")
      .where("ccrm.Customer_Id", customerId);

    // Combine customer details and roles
    const result = {
      ...customerDetails,
      Roles: roles.map((role) => ({ Id: role.Id, Name: role.Name })),
    };

    return result;
  } catch (error) {
    console.error(error);
    error.statusCode = 500;
    error.message = "Error getting customer data.";
    throw error;
  }
}

export async function GetSingleCustomerAddress(customerId) {
  try {
    // Fetch customer details without roles
    const customerDetails = await knex("Customer")
      .select("Id", "Username", "Email", "Active", "CreatedOnUtc")
      .where("Id", customerId)
      .first();
    
    if (!customerDetails) {
      throw new Error("Customer not found");
    }


    // Fetch all addresses associated with the customer
    const addresses = await knex("Address")
      .select(
        "Id",
        "FirstName",
        "LastName",
        "Email",
        "Company",
        "CountryId",
        "StateProvinceId",
        "City",
        "Address1",
        "Address2",
        "ZipPostalCode",
        "PhoneNumber"
      )
      .where("Email", customerDetails.Email);


    // Fetch customer roles separately
    const roles = await knex("Customer_CustomerRole_Mapping as ccrm")
      .join("CustomerRole as cr", "ccrm.CustomerRole_Id", "cr.Id")
      .select("cr.Id", "cr.Name")
      .where("ccrm.Customer_Id", customerId);


    // Combine customer details, roles, and addresses
    const result = {
      ...customerDetails,
      Addresses: addresses, // Array of addresses
      Roles: roles.map((role) => ({ Id: role.Id, Name: role.Name })),
    };

    return result;
  } catch (error) {
    console.error(error);
    error.statusCode = 500;
    error.message = "Error getting customer data.";
    throw error;
  }
}


export async function DeleteCustomerAddress(addressId) {
  try {
    // Check if the address exists
    const address = await knex("Address")
      .select("Id")
      .where("Id", addressId)
      .first();

    if (!address) {
      throw new Error("Address not found");
    }

    // Delete the address
    await knex("Address")
      .where("Id", addressId)
      .del();

    return { success: true, message: "Address deleted successfully" };
  } catch (error) {
    console.error("Error deleting address:", error);
    error.statusCode = 500;
    error.message = "Error deleting address.";
    throw error;
  }
}




export async function UpdateCustomerRoles(
  customerId,
  rolesToAdd,
  rolesToRemove
) {
  const trx = await knex.transaction();

  try {
    // Add new roles
    if (rolesToAdd && rolesToAdd.length > 0) {
      // First, get existing roles for the customer
      const existingRoles = await trx("Customer_CustomerRole_Mapping")
        .where("Customer_Id", customerId)
        .select("CustomerRole_Id");

      const existingRoleIds = existingRoles.map((role) => role.CustomerRole_Id);

      // Filter out roles that already exist
      const newRoles = rolesToAdd.filter(
        (roleId) => !existingRoleIds.includes(roleId)
      );

      // Insert new roles
      if (newRoles.length > 0) {
        const rolesToInsert = newRoles.map((roleId) => ({
          Customer_Id: customerId,
          CustomerRole_Id: roleId,
        }));

        await trx("Customer_CustomerRole_Mapping").insert(rolesToInsert);
      }
    }

    // Remove roles
    if (rolesToRemove && rolesToRemove.length > 0) {
      await trx("Customer_CustomerRole_Mapping")
        .where("Customer_Id", customerId)
        .whereIn("CustomerRole_Id", rolesToRemove)
        .delete();
    }

    await trx.commit();

    return {
      success: true,
      message: "Customer updated successfully",
    };
  } catch (error) {
    await trx.rollback();
    console.error(error);
    throw error;
  }
}

export async function EditCustomerDetails(customerId, updateFields) {
  const trx = await knex.transaction();
  try {
    console.log(updateFields);
    const data = await trx("Customer")
      .select("Email")
      .where("Id", customerId)
      .first();

    await trx("Address").where("Email", data.Email).update(updateFields);

    await trx.commit();

    return {
      success: true,
      message: "Customer updated successfully",
    };
  } catch (error) {
    await trx.rollback();
    console.error("Error in EditCustomerDetails:", error);
    throw {
      statusCode: 500,
      message: "Error updating customer details.",
    };
  }
}

export async function EditCustomerActive(customerId, active) {
  const trx = await knex.transaction();
  try {
    await trx("Customer").where("Id", customerId).update({ Active: active });

    await trx.commit();

    return {
      success: true,
      message: "Customer active status updated successfully",
    };
  } catch (error) {
    await trx.rollback();
    console.error("Error in EditCustomerActive:", error);
    throw {
      statusCode: 500,
      message: "Error updating customer active status.",
    };
  }
}

export async function GetCustomerOrder(customerId) {
  console.log("Customer ID:", customerId); // Log the input for debugging
  try {
    return await knex("Order")
      .select([
        "Id",
        "CustomOrderNumber",
        "OrderStatusId",
        "OrderTotal",
        "PaymentStatusId",
        "ShippingStatusId",
        "CreatedOnUtc",
      ])
      .where("CustomerId", customerId) // Ensure this matches the database column
      .orderBy("CreatedOnUtc", "desc");
  } catch (error) {
    console.error("Error in GetCustomerOrder:", error);
    error.statusCode = 500;
    error.message = "Error getting customer orders.";
    throw error;
  }
}

export async function GetCustomerAddress(id) {
  try {
    // Step 1: Fetch Address IDs for the given customer ID
    const addressIds = await knex("CustomerAddresses")
      .select("Address_Id")
      .where("Customer_Id", id);

    if (!addressIds.length) {
      return {
        success: false,
        message: "No addresses found for the given customer ID",
      };
    }

    const addressIdArray = addressIds.map((row) => row.Address_Id);

    // Step 2: Fetch Address Details using Address IDs
    const addresses = await knex("Address")
      .select(
        "Id",
        "FirstName",
        "LastName",
        "Email",
        "Company",
        "CountryId",
        "StateProvinceId",
        "City",
        "Address1",
        "Address2",
        "ZipPostalCode",
        "PhoneNumber",
        "FaxNumber",
        "CustomAttributes",
        "CreatedOnUtc"
      )
      .whereIn("Id", addressIdArray);

    // Step 3: Return address details
    return { success: true, data: addresses };
  } catch (error) {
    console.error("Error fetching customer address:", error);
    return {
      success: false,
      message: "Failed to retrieve customer address",
      error,
    };
  }
}

// Function to get customer shopping cart and product names
export async function GetCustomerShoppingCart(id) {
  try {
    // Step 1: Fetch shopping cart items for the given customer ID
    const shoppingCartItems = await knex("dbo.ShoppingCartItem")
      .select(
        "Id",
        "StoreId",
        "ShoppingCartTypeId",
        "CustomerId",
        "ProductId",
        "AttributesXml",
        "CustomerEnteredPrice",
        "Quantity",
        "RentalStartDateUtc",
        "RentalEndDateUtc",
        "CreatedOnUtc",
        "UpdatedOnUtc"
      )
      .where("CustomerId", id);

    // If no shopping cart items are found, return an empty array
    if (shoppingCartItems.length === 0) {
      return [];
    }

    // Step 2: Extract unique ProductIds
    const productIds = [
      ...new Set(shoppingCartItems.map((item) => item.ProductId)),
    ];

    // Step 3: Fetch product details (product names and prices) for the unique ProductIds
    const products = await knex("dbo.Product")
      .select("Id", "Name", "Price") // Include 'Price' field
      .whereIn("Id", productIds);

    // Step 4: Merge product names and prices with shopping cart items
    const shoppingCartWithDetails = shoppingCartItems.map((item) => {
      const product = products.find((p) => p.Id === item.ProductId);
      return {
        ...item,
        ProductName: product ? product.Name : "Unknown Product", // If product name is not found, return 'Unknown Product'
        ProductPrice: product ? product.Price : 0, // If product price is not found, return 0
      };
    });

    return shoppingCartWithDetails; // Return the combined data
  } catch (error) {
    console.error("Error fetching shopping cart data:", error);
    throw new Error("An error occurred while fetching the shopping cart data.");
  }
}



export async function AddCustomerAddress(customerId, addressData) {
  try {
    const newAddress = {
      FirstName: addressData.FirstName,
      LastName: addressData.LastName,
      Email: addressData.Email,
      Company: addressData.Company,
      CountryId: addressData.Country,
      StateProvinceId: addressData.State,
      City: addressData.City,
      Address1: addressData.Address1,
      Address2: addressData.Address2,
      ZipPostalCode: addressData.ZipPostalCode,
      PhoneNumber: addressData.PhoneNumber,
      CreatedOnUtc: new Date(),
    };
    console.log("New Address:", newAddress);

    // Insert the address into the database
    const result = await knex("Address").insert(newAddress);
    return result;
  } catch (error) {
    console.error("Error adding customer address:", error);
    throw error;
  }
}