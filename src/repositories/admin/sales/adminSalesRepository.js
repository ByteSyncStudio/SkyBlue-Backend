import knex from "../../../config/knex.js";

export async function CurrentCartsTotalItems(page, size) {
    try {
        const offset = (page - 1) * size;

        let query = await knex('ShoppingCartItem as sci')
            .leftJoin('Customer as c', 'sci.CustomerId', 'c.Id')
            .select([
                'sci.CustomerId',
                'c.Email',
                knex.raw('COUNT(*) OVER() AS total_count')
            ])
            .count('sci.Id as TotalItems')
            .sum('sci.Quantity as TotalQuantity')
            .max('sci.CreatedOnUtc as LastCreatedDate')
            .max('sci.UpdatedOnUtc as LastUpdatedDate')
            .groupBy('sci.CustomerId', 'c.Email')
            .orderBy('LastUpdatedDate', 'desc')
            .offset(offset)
            .limit(size);

        const totalItems = query.length > 0 ? query[0].total_count : 0;
        const totalPages = Math.ceil(totalItems / size)

        //? Removing total_count from results
        const carts = query.map(({total_count, ...cart}) => cart)

        return {
            TotalItems: totalItems,
            TotalPages: totalPages,
            CurrentPage: page,
            data: carts,
        };
    } catch (error) {
        console.error('Error in fetching carts', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function SpecificCart(customerId) {
    try {
        let query = await knex('ShoppingCartItem as sci')
            .leftJoin('Product as p', 'sci.ProductId', 'p.Id')
            .select([
                'sci.Id',
                'sci.ProductId',
                'sci.Quantity',
                'p.Name',
                'p.Price'
            ])
            .where('sci.CustomerId', customerId);

        return query;
    } catch (error) {
        console.error('Error in fetching specific cart: ', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}