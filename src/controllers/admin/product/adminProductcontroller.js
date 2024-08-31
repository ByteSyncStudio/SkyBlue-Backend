import knex from "../../../config/knex";
import { AddProduct } from "../../../repositories/admin/product/adminProductRepository";


//! TRY CATCH
export const addProduct = async (req, res) => {
    //? Producttypeid = 5
    //? SKU = null
    //? productTag isnt used
    //? showOnHomePage wont be used (default 0)
    //? Available start and end date not used (null)
    //? adminComment wont be used (null)
    //? priceGroup wont be used (null)
    //? productCost wont be used (0.0)
    //? hasTierPrices always true (1)
    //? disableBuyButton always false (0)
    //? disableWishlistButton always false (0),
    //? isTaxExempt always false (0)
    //? taxCategoryId is always 1
    //? tierPriceQuantity is always 1

    const {
        visibleIndividually,
        aisleLocation,
        boxQuantity,
        name,
        shortDescription,
        fullDescription,
        barcode,
        boxBarcode,
        published,
        markAsNew,
        adminComment,
        price,
        oldPrice,
        //* whichever price (1-5) is present will be inserted along respective customer role 
        price1,
        price2,
        price3,
        price4,
        price5,
        hasDiscountApplied,
        allowedQuantities, //* Comma seperated values of quanitites allowed
        orderMinimumQuantity, //* if null, default = 1
        orderMaximumQuantity, //* if null, default = 10000
        category, //* results can only be from /product/category/all

    } = req.body;

    try {
        await knex.transaction(async (trx) => {
            const productId = await AddProduct(req.body, trx);
        })

    } catch (error) {

    }
}

