import knex from '../../../config/knex.js'

export async function AddProduct(product, trx) {
    try {
        const result = await trx('Product').insert({
            ProductTypeId: 5,
            ParentGroupedProductId: 0,
            VisibleIndividually: 1,
            

        })

    } catch (error) {
        console.error("Error creating user:\n", error);
        throw error;
    }
}