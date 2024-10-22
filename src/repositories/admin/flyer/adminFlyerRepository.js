import knex from "../../../config/knex.js";
import { generateImageUrl2 } from "../../../utils/imageUtils.js";


export async function GetFlyerProducts() {
    try {
        console.log("damn");
    } catch (error) {
        console.error('Error Fetching Flyers:', error);
        throw {
            statusCode: 500,
            message: 'Error Fetching Flyers.'
        };
    }
}

export async function GetAllFlyers() {
    try {
        const flyers = await knex('Flyer as f')
            .join('Product as p', 'f.ProductId', 'p.Id')  // Joining Flyer and Product tables
            .select(
                'f.Id as FlyerId',
                'f.ProductId',
                'p.Name as ProductName',  // Fetching product name
                'f.Price',
                'f.DisplayOrder',
                'f.StoreId'
            );
        return flyers;
    } catch (error) {
        console.error('Error Fetching Flyers:', error);
        throw {
            statusCode: 500,
            message: 'Error Fetching Flyers.'
        };
    }
}

export async function AddProductToFlyer(productDetails) {
    try {
        // Insert new product details into the Flyer table
        await knex('Flyer').insert({
            ProductId: productDetails.ProductId,
            Price: productDetails.Price,
            DisplayOrder: productDetails.DisplayOrder,
            StoreId: productDetails.StoreId
        });
        return {
            success: true,
            message: 'Product added to flyer successfully.'
        };
    } catch (error) {
        console.error('Error adding product to flyer:', error);
        throw {
            statusCode: 500,
            message: 'Error adding product to flyer.'
        };
    }
}
// Function for updating the display order of a product in the flyer
export async function EditProductFlyer({ productid, DisplayOrder }) {
    try {
        console.log("object", productid, DisplayOrder);
        // Check if flyer with the given productid exists
        const flyer = await knex('Flyer')
            .where({ ProductId: productid })
            .first();

        if (!flyer) {
            throw {
                statusCode: 404,
                message: 'Flyer not found',
            };
        }

        // Update the DisplayOrder for the flyer
        await knex('Flyer')
            .where({ ProductId: productid })
            .update({
                DisplayOrder: DisplayOrder,
            });

    } catch (error) {
        console.error('Error editing product in flyer:', error);
        throw {
            statusCode: 500,
            message: 'Error editing product in flyer.',
        };
    }
}

// Function for deleting a flyer
export async function DeleteProductFlyer(flyerId) {
    try {
        // Check if flyer with the given flyerId exists
        const flyer = await knex('Flyer')
            .where({ Id: flyerId })
            .first();

        if (!flyer) {
            throw {
                statusCode: 404,
                message: 'Flyer not found',
            };
        }

        // Delete the flyer from the database
        await knex('Flyer')
            .where({ Id: flyerId })
            .del();

    } catch (error) {
        console.error('Error deleting product in flyer:', error);
        throw {
            statusCode: 500,
            message: 'Error deleting product in flyer.',
        };
    }
}

// Updated GetFlyerPreview to handle a single role
export async function GetFlyerPreview(customerRole) {
    try {
      // Step 1: Fetch all necessary data using joins
      const flyerData = await knex('Flyer')
        .leftJoin('Product', 'Flyer.ProductId', 'Product.Id')
        .leftJoin('Product_Picture_Mapping', 'Flyer.ProductId', 'Product_Picture_Mapping.ProductId')
        .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
        .leftJoin('TierPrice', function() {
          this.on('Flyer.ProductId', '=', 'TierPrice.ProductId')
            .andOn('TierPrice.CustomerRoleId', '=', knex.raw('?', [customerRole ? customerRole.id : null]));
        })
        .select(
          'Flyer.Id as FlyerId',
          'Flyer.ProductId',
          'Flyer.Price',
          'Flyer.DisplayOrder',
          'Flyer.StoreId',
          'Product.Name as ProductName',
          'Picture.MimeType',
          'Picture.SeoFilename',
          'Product_Picture_Mapping.PictureId',
          'TierPrice.Price as TierPrice'
        );
  
      // Step 2: Group the data by FlyerId
      const groupedFlyerData = flyerData.reduce((acc, flyer) => {
        if (!acc[flyer.FlyerId]) {
          acc[flyer.FlyerId] = {
            Id: flyer.FlyerId,
            ProductId: flyer.ProductId,
            ProductName: flyer.ProductName,
            Price: flyer.Price,
            TierPrice: flyer.TierPrice || null,
            DisplayOrder: flyer.DisplayOrder,
            StoreId: flyer.StoreId,
            ImageUrls: []
          };
        }
  
        if (flyer.PictureId && flyer.MimeType && flyer.SeoFilename) {
          const imageUrl = generateImageUrl2(flyer.PictureId, flyer.MimeType, flyer.SeoFilename);
          acc[flyer.FlyerId].ImageUrls.push(imageUrl);
        }
  
        return acc;
      }, {});
  
      // Step 3: Convert the grouped data to an array
      const flyerPreviewList = Object.values(groupedFlyerData);
  
      // Return the complete flyer preview list
      return flyerPreviewList;
    } catch (error) {
      console.error("Error in GetFlyerPreview:", error);
      throw new Error("Error fetching flyer preview");
    }
  }