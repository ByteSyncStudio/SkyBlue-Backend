//helper fucntion for cart

import knex from "../config/knex.js";


export const fetchCartItems = async (userId) => {
  const subquery = knex("Product_Picture_Mapping")
    .select(
      "Product_Picture_Mapping.ProductId",
      knex.raw("MIN(Picture.Id) as PictureId"),
      knex.raw("MIN(Picture.MimeType) as MimeType"),
      knex.raw("MIN(Picture.SeoFileName) as SeoFileName")
    )
    .leftJoin("Picture", "Product_Picture_Mapping.PictureId", "Picture.Id")
    .groupBy("Product_Picture_Mapping.ProductId")
    .as("PictureData");

  const cartItems = await knex("ShoppingCartItem")
    .where("ShoppingCartItem.CustomerId", userId)
    .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
    .leftJoin(subquery, "ShoppingCartItem.ProductId", "PictureData.ProductId")
    .select(
      knex.raw("MIN(ShoppingCartItem.Id) as Id"),
      "ShoppingCartItem.ProductId",
      "Product.Name",
      knex.raw("SUM(ShoppingCartItem.Quantity) as Quantity"),
      "Product.Price",
      "Product.OrderMinimumQuantity",
      "Product.OrderMaximumQuantity",
      "PictureData.PictureId",
      "PictureData.MimeType",
      "PictureData.SeoFileName",
      "ShoppingCartItem.ShoppingCartTypeId",
      knex.raw("Product.StockQuantity as Stock")
    )
    .groupBy(
      "ShoppingCartItem.ProductId", "ShoppingCartItem.ShoppingCartTypeId",

      "Product.Name",
      "Product.Price",
      "Product.OrderMinimumQuantity",
      "Product.OrderMaximumQuantity",
      "PictureData.PictureId",
      "PictureData.MimeType",
      "PictureData.SeoFileName",
      "Product.StockQuantity"
    );

  return cartItems;
};

export const getCategoryMappings = async (productIds) => {
  return await knex("Product_Category_Mapping")
    .whereIn("ProductId", productIds);
};

export const getDiscountCategories = async (categoryIds) => {
  console.log("Category IDs:", categoryIds);
  return await knex("Discount_AppliedToCategories")
    .whereIn("Category_Id", categoryIds);
};

export const getDiscountProducts = async (productIds) => {
  console.log("Discount product IDs:", productIds);
  return await knex("Discount_AppliedToProducts")
    .whereIn("Product_Id", productIds);
};

export const getDiscounts = async (discountIds) => {
  console.log("Discount IDs:", discountIds);
  return await knex("Discount")
    .whereIn("Id", discountIds);
};

export const getTierPrices = async (productIds, customerRoles) => {
  console.log("Fetching tier prices for productIds:", productIds);
  console.log("Fetching tier prices for customerRoles:", customerRoles);
  return await knex("TierPrice")
    .whereIn("CustomerRoleId", customerRoles)
    .whereIn("ProductId", productIds)
    .orderBy("Price", "asc");
};


