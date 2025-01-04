import knex from "../../../config/knex.js";

export async function GetBulkEdit(
  categoryId,
  categoryName,
  productName,
  manufacturerId,
  vendorId,
  published,
  page,
  size
) {
  try {
    const offset = (page - 1) * size;
    let query = knex("Product")
      .select([
        "Product.Id",
        "Product.Name",
        "Product.SKU",
        "Product.Price",
        "Product.HasTierPrices",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity",
        "Product.Barcode",
        "Product.Barcode2",
        "Product.StockQuantity",
        "Product.Published",
        "Product.Deleted",
        knex.raw("MAX(Product.ItemLocation) as ItemLocation"), // Aggregation for ItemLocation
        knex.raw("MAX(Product.BoxQty) as BoxQty"), // Aggregation for BoxQty
        knex.raw("COUNT(*) OVER() AS total_count"),
        "Vendor.Name as VendorName"  // Join with Vendor table to get Vendor Name
      ])
      .leftJoin("Vendor", "Product.VendorId", "Vendor.Id") // Join Vendor table to get vendor info
      .where("Product.Deleted", false)
      .groupBy(
        "Product.Id",
        "Product.Name",
        "Product.Price",
        "Product.HasTierPrices",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity",
        "Product.Barcode",
        "Product.Barcode2",
        "Product.SKU",
        "Product.StockQuantity",
        "Product.Published",
        "Product.Deleted",
        "Product.UpdatedOnUTC",
        "Vendor.Name" // Include Vendor Name in Group By
      )
      .orderBy("Product.UpdatedOnUTC", "desc");

    // Apply filters based on input parameters
    if (categoryId) {
      query = query
        .join("Product_Category_Mapping", "Product.Id", "Product_Category_Mapping.ProductId")
        .join("Category", "Product_Category_Mapping.CategoryId", "Category.Id")
        .where("Category.Id", categoryId);
    }

    if (categoryName) {
      query = query
        .join("Product_Category_Mapping", "Product.Id", "Product_Category_Mapping.ProductId")
        .join("Category", "Product_Category_Mapping.CategoryId", "Category.Id")
        .where("Category.Name", "like", `%${categoryName}%`);
    }

    if (productName) {
      query = query.andWhere("Product.Name", "like", `%${productName}%`);
    }

    if (manufacturerId) {
      query = query
        .join(
          "Product_Manufacturer_Mapping as pmm",
          "Product.Id",
          "pmm.ProductId"
        )
        .join("Manufacturer", "pmm.ManufacturerId", "Manufacturer.Id")
        .where("Manufacturer.Id", manufacturerId);
    }

    if (vendorId) {
      query = query
        .where("Product.VendorId", vendorId); // Filter by Vendor ID
    }

    if (published === 0 || published === 1) {
      query = query.andWhere("Product.Published", published === 1);
    }

    // Return 25 items per page (size is now 25)
    query = query.limit(25).offset(offset);

    const products = await query;

    // Calculate pagination metadata
    const totalItems =
      products.length > 0 ? products[0].total_count : 0;
    const totalPages = Math.ceil(totalItems / 25);

    return {
      totalItems,
      totalPages,
      currentPage: page,
      products,
    };
  } catch (error) {
    console.error("Error in GetBulkEdit:", error);
    error.statusCode = 500;
    error.message = "Error in GetBulkEdit";
    throw error;
  }
}


export const EditBulkProduct = async (changes) => {
  console.log("Changes:", changes);
  const productUpdates = Object.entries(changes).map(([productId, updates]) => {
    return knex('Product')
      .where({ Id: productId })
      .update(updates);
  });

  // Perform all updates in parallel
  await Promise.all(productUpdates);
}

export const BulkDeleteProducts = async (productIds) => {
  return await knex('Product')
    .whereIn('Id', productIds)
    .update({ Deleted: 1 });
}