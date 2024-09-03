import knex from "../config/knex.js";
import crypto from "crypto";
import { generateImageUrl2 } from "../utils/imageUtils.js";

export async function GetUserInfo(user) {
  const countries = [
    {
      id: 1,
      name: "United States",
    },
    {
      id: 2,
      name: "Canada",
    },
  ];

  return await knex("Address")
    .join("StateProvince", "StateProvince.Id", "=", "Address.StateProvinceId")
    .select([
      "Address.FirstName",
      "Address.LastName",
      "Address.Company",
      "Address.Address1",
      "Address.ZipPostalCode",
      "Address.City",
      "Address.CountryId",
      "Address.StateProvinceId",
      "StateProvince.Name as StateProvinceName",
      "Address.PhoneNumber",
    ])
    .where("Address.Email", user.email);
}

export async function ChangePassword(user, currentPassword, newPassword) {
  const { Password: storedPassword, PasswordSalt: storedSalt } = await knex(
    "CustomerPassword"
  )
    .select(["Password", "PasswordSalt"])
    .where("CustomerId", user.id)
    .orderBy("CreatedOnUtc", "desc")
    .first();

  const givenHashedPassword = crypto
    .createHash("sha1")
    .update(currentPassword + storedSalt)
    .digest("hex")
    .toUpperCase();

  if (givenHashedPassword === storedPassword) {
    const newSalt = crypto.randomBytes(6).toString("base64").slice(0, 7) + "=";
    const newHashedPassword = crypto
      .createHash("sha1")
      .update(newPassword + newSalt)
      .digest("hex")
      .toUpperCase();

    try {
      await knex.transaction(async (trx) => {
        await trx("CustomerPassword").insert({
          CustomerId: user.id,
          Password: newHashedPassword,
          PasswordSalt: newSalt,
          CreatedOnUtc: new Date().toISOString(),
          PasswordFormatId: 1, // Always 1
        });
      });

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error("Error updating password:", error.message);
      throw new Error("Failed to update password. Please try again later.");
    }
  } else {
    return {
      success: false,
      message: "Current Password is incorrect",
      statusCode: 400,
    };
  }
}

export async function UpdateUserInfo(user, updatedFields) {
  try {
    // Remove the Email field if it exists in the updatedFields object
    if ("Email" in updatedFields) {
      delete updatedFields.Email;
    }

    // Check if there are any fields to update
    if (Object.keys(updatedFields).length === 0) {
      return {
        success: false,
        message: "No fields to update",
        statusCode: 400,
      };
    }

    await knex.transaction(async (trx) => {
      await trx("Address").where("Email", user.email).update(updatedFields);
    });

    return { success: true, message: "User info updated successfully" };
  } catch (error) {
    console.error("Error updating user info:", error.message);
    throw new Error("Failed to update user info. Please try again later.");
  }
}

export async function GetCustomerOrders(user) {
  try {
    const orders = await knex("Order")
      .select([
        "Id",
        "CreatedOnUtc",
        "OrderSubtotalInclTax",
        "OrderSubtotalExclTax",
        "OrderTotal",
        "OrderTax",
      ])
      .where("CustomerId", user.id)
      .orderBy("CreatedOnUtc", "desc");
    return orders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw error;
  }
}


export async function GetSingleCustomerOrders(orderId) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required.');
      }
  
      // Fetch order items and join with Product, Product_Picture_Mapping, and Picture tables
      const orderItems = await knex('dbo.OrderItem as oi')
        .leftJoin('dbo.Product as p', 'oi.ProductId', 'p.Id')
        .leftJoin('dbo.Product_Picture_Mapping as ppm', 'p.Id', 'ppm.ProductId')
        .leftJoin('dbo.Picture as pic', 'ppm.PictureId', 'pic.Id')
        .where({ 'oi.OrderId': orderId })
        .select(
          'oi.OrderItemGuid',
          'oi.OrderId',
          'oi.ProductId',
          'oi.Quantity',
          'oi.UnitPriceInclTax',
          'oi.UnitPriceExclTax',
          'oi.PriceInclTax',
          'oi.PriceExclTax',
          'oi.OriginalProductCost',
          'p.Name as ProductName',
          'pic.Id as PictureId',
          'pic.MimeType',
          'pic.SeoFilename'
        );
  
      if (orderItems.length === 0) {
        return null;
      }
  
      // Map image URLs to order items
      const orderItemsWithImages = orderItems.map(item => {
        const imageUrl = item.PictureId ? generateImageUrl2(item.PictureId, item.MimeType, item.SeoFilename) : '';
        return {
          ...item,
          imageUrl,
        };
      });
  
      return orderItemsWithImages;
    } catch (error) {
      console.error("Error fetching order items by order ID:", error);
      throw error;
    }
  }

export async function GetCountryList() {
    return await knex('Country')
        .select([
            'Id',
            'Name'
        ])
}

export async function GetStateList(countryId) {
    return await knex('StateProvince')
        .select([
            'Id',
            'Name'
        ])
        .where('CountryId', countryId)
}