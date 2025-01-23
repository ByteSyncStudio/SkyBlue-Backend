import knex from "../../../config/knex.js";
import {
  AddProduct,
  MapToCategory,
  AddTierPrices,
  AddPicture,
  MapProductToPicture,
  UpdateProduct,
  UpdateCategoryMapping,
  UpdateProductPictures,
  UpdateTierPrices,
  DeleteProduct,
  DeleteProductPictures,
  listBestsellers,
  GetProduct,
  MapDiscountToProduct,
  UpdateDiscountMapping,
  DeleteDiscountMapping,
  DeleteTierPrice,
  ListInventory,
  MapToManufacturer,
  DeleteManufacturerMapping,
  UpdateManufacturerMapping,
  UpdateProductStock,
  GetProductNames,
  GetProductSEODetail,
  getProductGeneralInfo,
  getProductInventory,
  Getmapping,
  updateGeneralProduct,
  updatePriceDetailProduct,
  DeleteTierPriceProduct,
  UpdateProductInventory,
  UpdateProductMapping,
  GetProductImages,
  updateProductPublishedStatus,
  DeleteSelectedProduct,
} from "../../../repositories/admin/product/adminProductRepository.js";
import multer from "multer";
import { queueFileUpload } from "../../../config/ftpsClient.js";
import { ListSearchProducts } from "../../../repositories/admin/product/adminProductRepository.js";
import { DeleteManufacturer } from "../../../repositories/admin/manufacturer/adminManufacturerRepository.js";
import { getAllEmailsByRole } from "../../../utils/massEmail/getEmails.js";
import { SendBulkEmails } from "../../../config/emailService.js";

const upload = multer({ dest: "uploads/" });

export const addProduct = [
  upload.array("images"),
  async (req, res) => {
    const {
      VisibleIndividually,
      ItemLocation,
      BoxQty,
      Name,
      ShortDescription,
      FullDescription,
      Barcode,
      Barcode2,
      Published,
      MarkAsNew,
      AdminComment,
      Price,
      OldPrice,
      Price1,
      Price2,
      Price3,
      Price4,
      Price5,
      Role1,
      Role2,
      Role3,
      Role4,
      Role5,
      HasDiscountApplied,
      AllowedQuantities,
      OrderMinimumQuantity,
      OrderMaximumQuantity,
      CategoryId,
      StockQuantity,
      SeoFilenames, // Array of SEO filenames for pictures
      DiscountId,
      ManufacturerId,
    } = req.body;

    const files = req.files;

    const seoFilenamesArray = SeoFilenames
      ? SeoFilenames.split(",").map((name) => name.trim())
      : [];

    console.log("Request body:", req.body);
    console.log("Files:", files);

    try {
      await knex.transaction(async (trx) => {
        // 1. Add the product
        const productId = await AddProduct(req.body, trx);
        console.log("Product added with ID:", productId);

        // 2. Map the product to the category
        if (CategoryId) {
          await MapToCategory(productId, CategoryId, trx);
          console.log("Product mapped to category:", CategoryId);
        }

        // 3. Add tier prices (only if not null)
        const tierPrices = [
          { roleId: Role1, price: Price1 },
          { roleId: Role2, price: Price2 },
          { roleId: Role3, price: Price3 },
          { roleId: Role4, price: Price4 },
          { roleId: Role5, price: Price5 },
        ].filter((tp) => tp.roleId != null && tp.price != null);

        if (tierPrices.length > 0) {
          await AddTierPrices(productId, tierPrices, trx);
          console.log("Tier prices added:", tierPrices);
        }

        // 4. Handle picture uploads and mapping
        if (files && files.length > 0) {
          console.log("Processing", files.length, "images");
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const seoFilename =
              seoFilenamesArray[i] || `product-${productId}-image-${i + 1}`;
            const fileExtension = file.mimetype.split("/")[1];

            // Add picture to database first to get the picture ID
            const pictureId = await AddPicture(
              {
                mimeType: file.mimetype,
                seoFilename: seoFilename,
              },
              trx
            );
            console.log("Picture added with ID:", pictureId);

            // Use pictureId for the formatted ID in the remote path
            const formattedId = pictureId.toString().padStart(7, "0");
            const remotePath = `/acc1845619052/SkyblueWholesale/Content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;

            console.log("Queueing file upload:", file.path, "to", remotePath);
            // Queue file upload
            queueFileUpload(file.path, remotePath);

            // Map product to picture
            await MapProductToPicture(productId, pictureId, i + 1, trx);
            console.log("Product mapped to picture:", productId, pictureId);
          }
        } else {
          console.log("No images to process");
        }

        // 5. Map discount to product
        if (DiscountId) {
          await MapDiscountToProduct(productId, DiscountId, trx);
          console.log("Discount mapped to product:", DiscountId);
        }

        // 6. Map product to manufacturer
        if (ManufacturerId) {
          await MapToManufacturer(productId, ManufacturerId, trx);
          console.log("Product mapped to manufacturer: ", ManufacturerId);
        }
      });

      res.status(201).send({ success: true, message: "Product Added." });
    } catch (error) {
      console.error("Error in addProduct:", error);
      res.status(error.statusCode || 500).send(error.message || "Server error");
    }
  },
];

export const updateProduct = [
  upload.array("images"),
  async (req, res) => {
    const productId = req.params.id;
    const {
      Price1,
      Price2,
      Price3,
      Price4,
      Price5,
      Role1,
      Role2,
      Role3,
      Role4,
      Role5,
      CategoryId,
      SeoFilenames,
      DiscountId,
      ManufacturerId,
      ...productData // All other fields go into productData
    } = req.body;

    console.log(`Price1: ${Price1}, typeof: ${typeof Role1}`);

    const files = req.files;
    const seoFilenamesArray = SeoFilenames
      ? SeoFilenames.split(",").map((name) => name.trim())
      : [];

    console.log("Product data: ", productData);
    console.log("Files: ", files);
    try {
      await knex.transaction(async (trx) => {
        // 1. Update the product
        await UpdateProduct(productId, productData, trx);

        // 2. Update category mapping
        if (CategoryId) {
          await UpdateCategoryMapping(productId, CategoryId, trx);
        }

        // 3. Update tier prices

        const tierPrices = [
          { roleId: Role1, price: Price1 },
          { roleId: Role2, price: Price2 },
          { roleId: Role3, price: Price3 },
          { roleId: Role4, price: Price4 },
          { roleId: Role5, price: Price5 },
        ].filter((tp) => tp.roleId != null && tp.price != null);

        if (tierPrices.length > 0) {
          await UpdateTierPrices(productId, tierPrices, trx);
        }

        // 4. Handle picture updates
        //? Delete and add new images
        if (files && files.length > 0) {
          console.log("Processing", files.length, "new images");
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const seoFilename =
              seoFilenamesArray[i] || `product-${productId}-image-${i + 1}`;
            const fileExtension = file.mimetype.split("/")[1];

            // Add picture to database first to get the picture ID
            const pictureId = await AddPicture(
              {
                mimeType: file.mimetype,
                seoFilename: seoFilename,
              },
              trx
            );
            console.log("New picture added with ID:", pictureId);

            // Use pictureId for the formatted ID in the remote path
            const formattedId = pictureId.toString().padStart(7, "0");
            const remotePath = `/acc1845619052/SkyblueWholesale/Content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;

            console.log("Queueing file upload:", file.path, "to", remotePath);
            // Queue file upload
            queueFileUpload(file.path, remotePath);

            // Map product to new picture
            await MapProductToPicture(productId, pictureId, i + 1, trx);
            console.log("Product mapped to new picture:", productId, pictureId);
          }
        } else {
          console.log("No new images to process");
        }

        // 5. Update discount mapping
        if (DiscountId === "0") {
          await DeleteDiscountMapping(productId, trx);
          console.log("Discount mapping deleted for product:", productId);
        } else if (DiscountId) {
          await UpdateDiscountMapping(productId, DiscountId, trx);
          console.log("Discount mapping updated for product:", productId);
        }

        // 6. Update Manufacturer mapping
        if (ManufacturerId === "0") {
          await DeleteManufacturerMapping(productId, trx);
          console.log("Manufacturer mapping deleted for product:", productId);
        } else if (ManufacturerId) {
          await UpdateManufacturerMapping(productId, ManufacturerId, trx);
          console.log("Manufacturer mapping updated for product:", productId);
        }
      });

      res.status(200).send({ success: true, message: "Product Updated." });
    } catch (error) {
      console.error("Error in updateProduct:", error);
      res.status(error.statusCode || 500).send(error.message || "Server error");
    }
  },
];

export const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    await DeleteProduct(productId);
    res.status(200).send({ success: true, message: "Product Deleted." });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(error.statusCode || 500).send(error.message || "Server error");
  }
};

export async function getBestSellers(req, res) {
  try {
    const sortBy = req.query.sortBy || "quantity";
    const size = req.query.size || 5;
    const searchTerm = req.query.term || "";
    const products = await listBestsellers(sortBy, size, req.user, searchTerm);
    res.status(200).send(products);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).send(error.message || "Server error");
  }
}

export async function getProducts(req, res) {
  try {
    const {
      categoryId,
      categoryName,
      product,
      manufacturer,
      vendor,
      published,
      size,
      page,
    } = req.query;
    const result = await ListSearchProducts(
      parseInt(categoryId),
      categoryName,
      product,
      manufacturer,
      vendor,
      parseInt(published),
      parseInt(page) || 1,
      parseInt(size) || 10
    );
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).send(error.message || "Server error");
  }
}

export async function getProduct(req, res) {
  const productId = req.params.id;
  try {
    const result = await GetProduct(productId);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).send(error.message || "Server error");
  }
}

export async function deleteTierPrice(req, res) {
  try {
    const { productId, customerRoleId } = req.body;
    const result = await DeleteTierPrice(productId, customerRoleId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function listInventory(req, res) {
  try {
    const { category, product, manufacturer, published, size, page } =
      req.query;
    const result = await ListInventory(
      category,
      product,
      manufacturer,
      parseInt(published),
      parseInt(page) || 1,
      parseInt(size) || 18
    );
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function updateProductStock(req, res) {
  try {
    const { productId } = req.params;
    const { stockQuantity } = req.body;
    await UpdateProductStock(productId, stockQuantity);
    res.status(200).send({ success: true, message: "Product stock updated." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductNames(req, res) {
  try {
    const { searchTerm } = req.query;
    res.status(200).send(await GetProductNames(searchTerm));
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function tester(req, res) {
  try {
    const result = await getAllEmailsByRole(1);
    // const result = ['shahryar2k3@gmail.com', 'kshahryar21@gmail.com']
    const emails = await SendBulkEmails(result, "Mass email", "Test");
    res.status(200).send(emails);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductSeoDetail(req, res) {
  const productId = req.params.id;
  try {
    if (!productId) {
      throw { statusCode: 400, message: "Product ID is required" };
    }

    const result = await GetProductSEODetail(productId);
    res.status(200).send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function updateProductSeoDetail(req, res) {
  const productId = req.params.id;
  const {
    MetaKeywords = null,
    MetaDescription = null,
    Metatitle = null,
  } = req.body; // Default to null

  try {
    if (!productId) {
      throw { statusCode: 400, message: "Product ID is required" };
    }

    // Ensure at least one field is provided for the update
    const updateData = { MetaKeywords, MetaDescription, Metatitle };
    const hasDataToUpdate = Object.values(updateData).some(
      (value) => value !== undefined
    );

    if (!hasDataToUpdate) {
      return res
        .status(400)
        .send({ success: false, message: "No data provided to update." });
    }

    await knex("Product").where("Id", productId).update(updateData);

    res.status(200).send({ success: true, message: "SEO details updated" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductDetail(req, res) {
  const productId = req.params.id;
  try {
    if (!productId) {
      throw { statusCode: 400, message: "Product ID is required" };
    }

    const result = await getProductGeneralInfo(productId);

    res.status(200).send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductDetailInventory(req, res) {
  const productId = req.params.id;
  try {
    if (!productId) {
      throw { statusCode: 400, message: "Product ID is required" };
    }

    const result = await getProductInventory(productId);

    res.status(200).send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductAvaliability(req, res) {
  try {
    const result = await knex("ProductAvailabilityRange").select("*");
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductMapping(req, res) {
  try {
    const productId = req.params.id;
    const result = await Getmapping(productId);
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function getProductPurchasedWithOrder(req, res) {
  const productId = req.params.id;
  try {
    // Step 1: Get Order Items for the Product
    const orderItems = await knex("dbo.OrderItem")
      .select("OrderId", "ProductId")
      .where("ProductId", productId);

    if (!orderItems.length) {
      return res
        .status(404)
        .json({ message: "No orders found for the product" });
    }

    // Step 2: Get Order details for each OrderId
    const orderIds = orderItems.map((item) => item.OrderId);
    const orders = await knex("dbo.Order")
      .select(
        "Id as OrderId",
        "CustomerId",
        "OrderStatusId",
        "ShippingStatusId",
        "PaymentStatusId"
      )
      .whereIn("Id", orderIds);

    // Step 3: Get Customer details for each order
    const customerIds = orders.map((order) => order.CustomerId);
    const customers = await knex("dbo.Customer")
      .select("Id as CustomerId", "Email")
      .whereIn("Id", customerIds);

    // Mapping order statuses based on the given conditions
    const orderStatusMap = {
      10: "Pending",
      20: "Processing",
      30: "Completed",
      40: "Cancelled",
    };

    // Prepare the response data
    const result = orders.map((order) => {
      const customer = customers.find((c) => c.CustomerId === order.CustomerId);
      return {
        OrderId: order.OrderId,
        CustomerEmail: customer ? customer.Email : "N/A",
        OrderStatus: orderStatusMap[order.OrderStatusId] || "Unknown",
        ShippingStatus: orderStatusMap[order.ShippingStatusId] || "Unknown",
        PaymentStatus: orderStatusMap[order.PaymentStatusId] || "Unknown",
      };
    });

    // Step 4: Send the response
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error fetching product orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

export async function updateGeneralInfoProduct(req, res) {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    const result = await updateGeneralProduct(productId, updateData);
    res.status(200).send({
      success: true,
      message: "Product Updated.",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function updatePriceDetailsProduct(req, res) {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Validate the request body
    if (!productId || !updateData) {
      return res.status(400).send({ success: false, message: "Invalid data." });
    }

    const result = await updatePriceDetailProduct(productId, updateData);

    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error." });
  }
}

export async function addTierPrice(req, res) {
  const productId = req.params.id;
  const storeId = 0;
  const { CustomerRoleId, Price, Quantity, StartDateTimeUtc, EndDateTimeUtc } =
    req.body;

  // Check if required fields are provided
  if (!CustomerRoleId || !Price || !Quantity) {
    return res
      .status(400)
      .send({ success: false, message: "All fields are required." });
  }

  try {
    // Prepare the tier price object
    const newTierPrice = {
      ProductId: productId,
      StoreId: storeId,
      CustomerRoleId,
      Price,
      Quantity,
      StartDateTimeUtc: StartDateTimeUtc ? new Date(StartDateTimeUtc) : null,
      EndDateTimeUtc: EndDateTimeUtc ? new Date(EndDateTimeUtc) : null,
    };

    console.log("New tier price:", newTierPrice);

    // Insert the new tier price into the database
    const result = await knex("TierPrice").insert(newTierPrice);

    res.status(201).send({
      success: true,
      message: "Tier price added successfully.",
      data: { ...newTierPrice, Id: result[0] }, // Assuming the DB returns the inserted ID
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error." });
  }
}

export async function deleteTierPriceProduct(req, res) {
  try {
    const productId = req.params.id;
    const { customerRoleId } = req.body;
    console.log("productId", productId);
    console.log("customerRoleId", customerRoleId);
    const result = await DeleteTierPriceProduct(productId, customerRoleId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function editTierPriceProduct(req, res) {
  try {
    const productId = req.params.id;
    const {
      CustomerRoleId,
      Price,
      Quantity,
      StartDateTimeUtc,
      EndDateTimeUtc,
    } = req.body;
    console.log("CustomerRoleId", CustomerRoleId);
    const result = await knex("TierPrice")
      .where("ProductId", productId)
      .andWhere("CustomerRoleId", CustomerRoleId)
      .update({
        Price,
        Quantity,
        StartDateTimeUtc: StartDateTimeUtc ? new Date(StartDateTimeUtc) : null,
        EndDateTimeUtc: EndDateTimeUtc ? new Date(EndDateTimeUtc) : null,
      });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
}

export async function updateInventoryProduct(req, res) {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Validate input
    if (!productId || Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .send("Invalid input: Provide product ID and update data.");
    }

    // Call service to update inventory
    const result = await UpdateProductInventory(productId, updateData);

    if (result) {
      res
        .status(200)
        .json({ success: true, message: "Inventory updated successfully." });
    } else {
      res.status(404).json({
        success: false,
        message: "Product not found or update failed.",
      });
    }
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateProductMapping(req, res) {
  try {
    const productId = req.params.id; // Extract the product ID
    const { categoryIds, manufacturerIds, vendorId } = req.body; // Destructure the input data

    // Update vendor and manufacturers
    const result = await UpdateProductMapping(productId, {
      categoryIds,
      manufacturerIds,
      vendorId,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in updateProductMapping:", error);
    res.status(500).send("Server error");
  }
}

export async function getProductImages(req, res) {
  try {
    const productId = req.params.id;
    const images = await GetProductImages(productId);
    res.status(200).send({ images });
  } catch (error) {
    console.error("Error in getProductImages:", error);
    res.status(500).send("Server error");
  }
}

export const addProductImages = [
  upload.array("images"),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const files = req.files;
      const { SeoFilenames } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images provided",
        });
      }

      const seoFilenamesArray = SeoFilenames
        ? SeoFilenames.split(",").map((name) => name.trim())
        : [];

      await knex.transaction(async (trx) => {
        // Process each image file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const seoFilename =
            seoFilenamesArray[i] || `product-${productId}-image-${i + 1}`;
          const fileExtension = file.mimetype.split("/")[1];

          // Add picture to database
          const pictureId = await AddPicture(
            {
              mimeType: file.mimetype,
              seoFilename: seoFilename,
            },
            trx
          );

          // Format ID for FTP path
          const formattedId = pictureId.toString().padStart(7, "0");
          const remotePath = `/acc1845619052/SkyblueWholesale/Content/images/thumbs/${formattedId}_${seoFilename}.${fileExtension}`;

          // Queue file upload to FTP
          queueFileUpload(file.path, remotePath);

          // Map product to picture
          await MapProductToPicture(productId, pictureId, i + 1, trx);
        }
      });

      res.status(200).json({
        success: true,
        message: "Images added successfully",
      });
    } catch (error) {
      console.error("Error adding product images:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add product images",
      });
    }
  },
];

export async function deleteProductImage(req, res) {
  try {
    const productId = req.params.productId;
    const imageId = req.params.imageId;

    if (!imageId) {
      return res.status(400).json({
        success: false,
        message: "No image ID provided",
      });
    }

    await knex.transaction(async (trx) => {
      // Unlink the image from the database
      await DeleteProductPictures(productId, [imageId], trx);
      //TODO: Delete the image from FTP server
    });

    res.status(200).json({
      success: true,
      message: "Images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product images",
    });
  }
}

export async function updatePublishedStatus(req,res){
  const { productIds, published } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Product IDs must be an array and not empty.' });
  }

  if (typeof published !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Published must be a boolean value.' });
  }

  try {
    const result = await updateProductPublishedStatus(productIds, published);
    return res.status(200).json({ success: true, message: `${result} products updated.` });
  } catch (error) {
    console.error('Error updating products:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the products.' });
  }
}

export async function deleteSelectedProduct(req, res) {
  const { productIds, deleted } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Product IDs must be an array and not empty.' });
  }

  if (typeof deleted !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Published must be a boolean value.' });
  }

  try {
    const result = await DeleteSelectedProduct(productIds, deleted);
    return res.status(200).json({ success: true, message: `${result} products updated.` });
  } catch (error) {
    console.error('Error updating products:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the products.' });
  }
}