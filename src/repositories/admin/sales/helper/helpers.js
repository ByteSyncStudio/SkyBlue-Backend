import knex from "../../../../config/knex.js";

export async function getTierPrices(productIds, roleId) {
    if (!roleId || productIds.length === 0) return {};

    try {
        const tierPrices = await knex('TierPrice')
            .select('ProductId', 'Price')
            .whereIn('ProductId', productIds)
            .where('CustomerRoleId', roleId)
            .where(function () {
                this.whereNull('StartDateTimeUtc')
                    .orWhere('StartDateTimeUtc', '<=', knex.fn.now());
            })
            .where(function () {
                this.whereNull('EndDateTimeUtc')
                    .orWhere('EndDateTimeUtc', '>=', knex.fn.now());
            })
            .orderBy('Quantity', 'asc');

        return tierPrices.reduce((acc, tp) => {
            if (!acc[tp.ProductId]) {
                acc[tp.ProductId] = tp.Price;
            }
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching tier prices:', error);
        return {};
    }
}

export async function getSubcategories(categoryId) {
    try {
        let subCategories;

        // Return all Categories if given 0
        if (categoryId === 0) {
            subCategories = await knex('Category')
                .select('Id')
        } else {
            // Get all subcategories (including the category itself)
            subCategories = await knex('Category')
                .withRecursive('SubCategories', (qb) => {
                    qb.select('Id')
                        .from('Category')
                        .where('Id', categoryId)
                        .unionAll((qb) => {
                            qb.select('c.Id')
                                .from('Category as c')
                                .innerJoin('SubCategories as sc', 'c.ParentCategoryId', 'sc.Id');
                        });
                })
                .select('Id')
                .from('Subcategories');
        }

        const subCategoryIds = subCategories.map(cat => cat.Id);

        return subCategoryIds;
    }
    catch (error) {
        error.statusCode = 500;
        error.message = "Subcategories not found";
        throw error;
    }
}