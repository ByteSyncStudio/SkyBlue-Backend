import knex from "../../../config/knex.js";
import { getTierPrices, getSubcategories } from "./helper/helpers.js";

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

export async function OrderSheet(categoryId, tierRole, page = 1, size = 1000, user, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, sortBy = 'recent') {
    try {
        const offset = (page - 1) * size;

        // Fetch subcategory IDs
        const subCategoryIds = await getSubcategories(categoryId);

        const query = knex.raw(`
            WITH RankedProducts AS (
                SELECT 
                    p.Id, p.Name, p.HasTierPrices, p.Price, p.FullDescription, p.ShortDescription,
                    p.OrderMinimumQuantity, p.OrderMaximumQuantity, p.StockQuantity, p.CreatedOnUTC,
                    COALESCE(c.Name, 'Uncategorized') AS CategoryName,
                    ppm.PictureId, pic.MimeType, pic.SeoFilename,
                    ROW_NUMBER() OVER (PARTITION BY p.Id ORDER BY ppm.DisplayOrder) AS RowNum
                FROM Product p
                JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId
                LEFT JOIN Category c ON pcm.CategoryId = c.Id
                LEFT JOIN Product_Picture_Mapping ppm ON p.Id = ppm.ProductId
                LEFT JOIN Picture pic ON ppm.PictureId = pic.Id
                WHERE pcm.CategoryId IN (${subCategoryIds.join(',')})
                    AND p.Published = 1 AND p.Deleted = 0
            ),
            TotalCount AS (
                SELECT COUNT(DISTINCT Id) AS total_count
                FROM RankedProducts
            )
            SELECT 
                rp.Id, rp.Name, rp.HasTierPrices, rp.Price, rp.FullDescription, rp.ShortDescription,
                rp.OrderMinimumQuantity, rp.OrderMaximumQuantity, rp.StockQuantity, rp.CreatedOnUTC,
                rp.CategoryName, rp.PictureId, rp.MimeType, rp.SeoFilename,
                tc.total_count
            FROM RankedProducts rp
            CROSS JOIN TotalCount tc
            WHERE rp.RowNum = 1
            ORDER BY rp.Name
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
            `,
            [offset, size]
        );

        const products = await query;

        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, tierRole);

        const processedProducts = products.map(product => ({
            ...product,
            TierPrices: tierPrices[product.Id] || []
        }));

        const totalProducts = products.length > 0 ? products[0].total_count : 0;
        
        // Group products by category
        const groupedProducts = processedProducts.reduce((acc, product) => {
            if (!acc[product.CategoryName]) {
                acc[product.CategoryName] = [];
            }
            acc[product.CategoryName].push(product);
            return acc;
        }, {});

        // Format the response
        const formattedData = Object.entries(groupedProducts).map(([category, data]) => ({
            category,
            data
        }));

        return {
            totalProducts,
            data: formattedData
        };
    } catch (error) {
        console.error('Error fetching specific cart:', error);
        throw error;
    }
}