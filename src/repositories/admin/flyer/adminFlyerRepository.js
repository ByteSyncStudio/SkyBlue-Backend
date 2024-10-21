import knex from "../../../config/knex.js";


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