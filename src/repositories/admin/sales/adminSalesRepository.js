import knex from "../../../config/knex.js";
import { getTierPrices } from "./helper/tierPrice.js";

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
            .leftJoin('Customer as c', 'sci.CustomerId', 'c.Id')
            .select([
                'sci.Id',
                'sci.ProductId',
                'sci.Quantity',
                'sci.CreatedOnUTC',
                'p.Name',
                'p.Price',
                'c.Email'
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

export async function OrderSheet(categoryId, tierRole, page = 1, size = 2, user, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, sortBy = 'recent') {
    try {
        const offset = (page - 1) * size;
        let orderByClause;
        switch (sortBy) {
            case 'price_asc':
                orderByClause = 'p.Price ASC';
                break;
            case 'price_desc':
                orderByClause = 'p.Price DESC';
                break;
            case 'name_asc':
                orderByClause = 'p.Name ASC';
                break;
            case 'name_desc':
                orderByClause = 'p.Name DESC';
                break;
            case 'recent':
            default:
                orderByClause = 'p.CreatedOnUTC DESC';
                break;
        }

        // Use conditional join and WHERE clause for categoryId check
        const query = knex.raw(
            `
            WITH ProductData AS (
                SELECT
                    p.CreatedOnUTC, p.Id, p.Name, p.HasTierPrices, p.Price,
                    p.FullDescription, p.ShortDescription, p.OrderMinimumQuantity,
                    p.OrderMaximumQuantity, p.AllowedQuantities, p.StockQuantity,
                    CASE WHEN ? = -1 THEN 'All Products' ELSE c.Name END AS CategoryName,
                    COUNT(*) OVER () AS total_count,
                    STRING_AGG(CONCAT(ppm.PictureId, ':', pic.MimeType, ':', pic.SeoFilename), '|') AS ImageData,
                    ROW_NUMBER() OVER (ORDER BY ${orderByClause}) AS RowNum
                FROM Product p
                LEFT JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId AND ? <> -1
                LEFT JOIN Category c ON pcm.CategoryId = c.Id
                LEFT JOIN Product_Picture_Mapping ppm ON p.Id = ppm.ProductId
                LEFT JOIN Picture pic ON ppm.PictureId = pic.Id
                WHERE p.Published = 1 AND p.Deleted = 0
                AND (pcm.CategoryId = ? OR ? = -1)
                AND p.Price BETWEEN ? AND ?
                GROUP BY p.CreatedOnUTC, p.Id, p.Name, p.HasTierPrices, p.Price,
                         p.FullDescription, p.ShortDescription, p.OrderMinimumQuantity,
                         p.OrderMaximumQuantity, p.AllowedQuantities, p.StockQuantity, c.Name
            )
            SELECT * FROM ProductData
            WHERE RowNum > ? AND RowNum <= ?
            `,
            [categoryId, categoryId, categoryId, categoryId, minPrice, maxPrice, offset, offset + size]
        );

        const products = await query;

        // Fetch tier prices for all products at once
        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, tierRole);

        // Process products for response
        const processedProducts = products.map(product => ({
            Id: product.Id,
            Name: product.Name,
            Price: product.HasTierPrices ? (tierPrices[product.Id] || product.Price) : product.Price,
            FullDescription: product.FullDescription,
            ShortDescription: product.ShortDescription,
            OrderMinimumQuantity: product.OrderMinimumQuantity,
            OrderMaximumQuantity: product.OrderMaximumQuantity,
            AllowedQuantities: product.AllowedQuantities,
            Stock: product.StockQuantity,
            total_count: product.total_count,
            CreatedOnUTC: product.CreatedOnUTC
        }));

        const totalProducts = products.length > 0 ? products[0].total_count : 0;
        const categoryName = products.length > 0 ? products[0].CategoryName : (categoryId === -1 ? "All Products" : "Category");
        
        const response = {
            categoryName,
            totalProducts,
            totalPages: Math.ceil(totalProducts / size),
            pageNumber: page,
            pageSize: size,
            sortBy,
            data: processedProducts
        };

        return response;
    } catch (error) {
        console.error('Error in OrderSheet: ', error);
        error.statusCode = 500;
        error.message = 'Error in OrderSheet.';
        throw error;
    }
}