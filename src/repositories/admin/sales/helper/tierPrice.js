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