import knex from '../config/knex.js';
import cache from '../config/cache.js'
import { generateImageUrl2 } from '../utils/imageUtils.js';


function getSpecificCategories() {
    return new Map([
        [36, 'Candies'],
        [111, 'Snacks'],
        [189, 'Beverages']
    ]);
}

function getMiscellaneousName() {
    return new Map([
        [-1, 'All Items']
    ]);
}

export async function getTierPrices(productIds, userRoles) {
    const tierPricingRoles = [6, 7, 8, 9, 10];
    const userTierRole = userRoles.find(role => tierPricingRoles.includes(role.Id));

    if (!userTierRole || productIds.length === 0) return {};

    try {
        const tierPrices = await knex('TierPrice')
            .select('ProductId', 'Price')
            .whereIn('ProductId', productIds)
            .where('CustomerRoleId', userTierRole.Id)
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

/**
 * Retrieves a list of specific categories from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */
async function listCategory() {
    // const specificCategories = getSpecificCategories();
    const miscCategory = getMiscellaneousName();
    try {
        const cacheKey = 'categories';
        const cachedCategories = cache.get(cacheKey);

        if (cachedCategories) {
            return cachedCategories;
        }

        // const categories = await knex('Category')
        //     .select(['Id', 'Name'])
        //     .whereIn('Id', Array.from(specificCategories.keys()))
        //     .orderBy('Id');

        let categories = [];

        const data = await knex('Category as c')
            .leftJoin('Picture as p', 'c.PictureId', 'p.Id')
            .select(['c.Id', 'c.Name', 'c.PictureId', 'p.MimeType', 'p.SeoFilename'])
            .where('ShowOnHomePage', true)


        // // Add 'All Items' where we dont want to specifically categorize
        // categories.push({ Id: -1, Name: miscCategory.get(-1) });

        // Add image URLs to categories
        const categoriesWithImages = data.map(category => {
            const imageUrl = category.PictureId
                ? generateImageUrl2(category.PictureId, category.MimeType, category.SeoFilename)
                : null;
            return {
                Id: category.Id,
                Name: category.Name,
                Image: imageUrl
            };
        });

        categories = categories.concat(categoriesWithImages);

        cache.set(cacheKey, categories);
        return categories;

    } catch (error) {
        error.statusCode = 500;
        error.message = "List Category Error";
        throw error;
    }
}


//? HELPER FUNCTION
/**
 * Retrieves all subcategories of a given category, including the category itself.
 * 
 * @param {number} categoryId - The ID of the category.
 * @returns {Promise<Array>} A promise that resolves to an array of subcategory IDs.
 */
async function getSubcategories(categoryId) {
    try {
        const cacheKey = `subcategories_${categoryId}`;
        const cachedSubcategories = cache.get(cacheKey);

        if (cachedSubcategories) {
            return cachedSubcategories;
        }

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

        // Setting for future cache
        cache.set(cacheKey, subCategoryIds);

        return subCategoryIds;
    }
    catch (error) {
        error.statusCode = 500;
        error.message = "Subcategories not found";
        throw error;
    }
}

/**
 * Retrieves a list of products from the specified category with pagination.
 * 
 * @param {string} category - The name of the category.
 * @param {number} page - The page number.
 * @param {number} size - The number of items per page.
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
async function listProductsFromCategory(categoryId, page = 1, size = 10, user, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, sortBy = 'recent') {
    const cacheKey = `products_${categoryId}_${page}_${size}_${user.roles.map(r => r.Id).join('_')}_${sortBy}_${minPrice}_${maxPrice}`;
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
        return cachedProducts;
    }

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

        console.log("products",products)

        // Fetch tier prices for all products at once
        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, user.roles);

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
            Images: product.ImageData ? product.ImageData.split('|').map(imgData => {
                const [pictureId, mimeType, seoFilename] = imgData.split(':');
                return generateImageUrl2(pictureId, mimeType, seoFilename);
            }).filter(Boolean) : [],
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

        // Cache the response
        cache.set(cacheKey, response);
        return response;
    } catch (error) {
        console.error('Error in listProductsFromCategory:', error);
        throw error;
    }
}

/**
* * Retrieves a list of best-selling products sorted by a specified criterion.*
* **
* * @param {string} sortBy - The criterion to sort by ('quantity' or 'amount').*
* * @param {number} size - The number of items to retrieve.*
* * @returns {Promise<Array>} A promise that resolves to an array of best-selling product objects.*
**/
async function listBestsellers(sortBy, size, user) {
    try {
        const cacheKey = `bestsellers_by_${sortBy}_${size}_${user.roles.map(r => r.Id).join('_')}`;
        const cachedBestSellers = cache.get(cacheKey);
        if (cachedBestSellers) {
            return cachedBestSellers;
        }
        const orderColumn = sortBy === 'quantity' ? 'TotalQuantity' : 'TotalAmount';

        const query = knex.raw(`
            WITH TopProducts AS (
                SELECT 
                    oi.ProductId,
                    SUM(oi.Quantity) as TotalQuantity,
                    SUM(oi.PriceExclTax) as TotalAmount,
                    ROW_NUMBER() OVER (ORDER BY SUM(CASE WHEN ? = 'quantity' THEN oi.Quantity ELSE oi.PriceExclTax END) DESC) as RowNum
                FROM OrderItem oi
                JOIN Product p ON oi.ProductId = p.Id
                WHERE p.Published = 1 AND p.Deleted = 0
                GROUP BY oi.ProductId
            )
            SELECT 
                p.Id,
                p.Name,
                p.HasTierPrices,
                p.Price,
                p.FullDescription,
                p.ShortDescription,
                p.OrderMinimumQuantity,
                p.OrderMaximumQuantity,
                p.AllowedQuantities,
                p.StockQuantity,
                ppm.PictureId,
                pic.MimeType,
                pic.SeoFilename,
                tp.TotalQuantity,
                tp.TotalAmount
            FROM TopProducts tp
            JOIN Product p ON tp.ProductId = p.Id
            LEFT JOIN Product_Picture_Mapping ppm ON p.Id = ppm.ProductId
            LEFT JOIN Picture pic ON ppm.PictureId = pic.Id
            WHERE tp.RowNum <= ?
            ORDER BY tp.RowNum
        `, [sortBy, size]);

        const products = await query;
        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, user.roles);

        const processedProducts = products.map(product => {
            const imageUrl = product.PictureId
                ? generateImageUrl2(product.PictureId, product.MimeType, product.SeoFilename)
                : null;
            const price = product.HasTierPrices ? (tierPrices[product.Id] || product.Price) : product.Price;
            return {
                Id: product.Id,
                Name: product.Name,
                Price: price,
                FullDescription: product.FullDescription,
                ShortDescription: product.ShortDescription,
                OrderMinimumQuantity: product.OrderMinimumQuantity,
                OrderMaximumQuantity: product.OrderMaximumQuantity,
                AllowedQuantities: product.AllowedQuantities,
                Stock: product.StockQuantity,
                Images: [imageUrl],
                Quantity: product.TotalQuantity,
                Amount: product.TotalAmount
            };
        });

        cache.set(cacheKey, processedProducts);
        return processedProducts;
    } catch (error) {
        console.error('Error in listBestsellers:', error);
        error.statusCode = 500;
        error.message = "Error in BestSellers";
        throw error;
    }
}
/**
 * Retrieves a list of new arrival products with pagination.
 * 
 * @param {number} size - The number of items per page.
 * @returns {Promise<Array>} A promise that resolves to an array of new arrival product objects.
 */
async function listNewArrivals(size, user) {
    try {
        const query = knex('Product')
            .select([
                'Product.CreatedonUTC',
                'Product.Id',
                'Product.Name',
                'Product.HasTierPrices',
                'Product.Price',
                'Product.FullDescription',
                'Product.ShortDescription',
                'Product.OrderMinimumQuantity',
                'Product.OrderMaximumQuantity',
                'Product.AllowedQuantities',
                'Product_Picture_Mapping.PictureId',
                'product.StockQuantity',
                'Picture.MimeType',
                'Picture.SeoFilename'
            ])
            .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
            .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
            .where('Product.Published', true)
            .where('Product.Deleted', false)
            .orderBy('Product.CreatedonUTC', 'desc')
            .limit(size);

        const products = await query;

        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, user.roles);

        const processedProducts = products.reduce((acc, product) => {
            const imageUrl = product.PictureId
                ? generateImageUrl2(product.PictureId, product.MimeType, product.SeoFilename)
                : null;
            const existingProduct = acc.find(p => p.Id === product.Id);

            const price = product.HasTierPrices ? (tierPrices[product.Id] || product.Price) : product.Price;

            if (existingProduct) {
                existingProduct.Images.push(imageUrl);
            } else {
                acc.push({
                    Id: product.Id,
                    Name: product.Name,
                    Price: price,
                    FullDescription: product.FullDescription,
                    ShortDescription: product.ShortDescription,
                    OrderMinimumQuantity: product.OrderMinimumQuantity,
                    OrderMaximumQuantity: product.OrderMaximumQuantity,
                    AllowedQuantities: product.AllowedQuantities,
                    Stock: product.StockQuantity,
                    Images: [imageUrl]
                });
            }

            return acc;
        }, []);

        return processedProducts;
    } catch (error) {
        error.statusCode = 500;
        error.message = "Error in NewArrivals";
        throw error;
    }
}

/**
 * Searches for products based on category IDs and a search term.
 * 
 * @param {Array<number>} categoryIds - The IDs of the categories to search within.
 * @param {string} searchTerm - The term to search for in the product names.
 * @param {number} page - The page number for pagination.
 * @param {number} size - The number of items per page.
 * @returns {Promise<Object>} A promise that resolves to an object containing the search results.
 */
async function listSearchProducts(categoryId, searchTerm, page = 1, size = 10, user, sortBy = 'recent') {
    try {
        const offset = (page - 1) * size;

        // Determine the sorting clause
        let orderByClause;
        switch (sortBy) {
            case 'price_asc':
                orderByClause = 'Product.Price ASC';
                break;
            case 'price_desc':
                orderByClause = 'Product.Price DESC';
                break;
            case 'name_asc':
                orderByClause = 'Product.Name ASC';
                break;
            case 'name_desc':
                orderByClause = 'Product.Name DESC';
                break;
            default:
                orderByClause = 'Product.CreatedOnUTC DESC'; // Default sorting by name ascending
                break;
        }

        // Start the base query with sorting applied
        let query = knex('Product')
            .distinct('Product.Id') // Ensure distinct products
            .select([
                'Product.Name',
                'Product.Price',
                'Product.HasTierPrices',
                'Product.FullDescription',
                'Product.ShortDescription',
                'Product.OrderMinimumQuantity',
                'Product.OrderMaximumQuantity',
                'Product_Picture_Mapping.PictureId',
                'Product.StockQuantity',
                'Product.CreatedOnUTC',
                'Product.AllowedQuantities',
                'Picture.MimeType',
                'Picture.SeoFilename',
                knex.raw('COUNT(*) OVER() AS total_count')
            ])
            .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
            .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
            .where('Product.Name', 'like', `%${searchTerm}%`)
            .where('Product.Published', true)
            .where('Product.Deleted', false)
            .groupBy([
                'Product.Id',
                'Product.Name',
                'Product.Price',
                'Product.HasTierPrices',
                'Product.FullDescription',
                'Product.ShortDescription',
                'Product.OrderMinimumQuantity',
                'Product.OrderMaximumQuantity',
                'Product_Picture_Mapping.PictureId',
                'Product.StockQuantity',
                'Product.CreatedOnUTC',
                'Product.AllowedQuantities',
                'Picture.MimeType',
                'Picture.SeoFilename'
            ])
            .orderByRaw(orderByClause) // Apply sorting
            .limit(size)
            .offset(offset);

        // Handle category filtering if categoryId matches specific categories
        if ([36, 111, 189].includes(categoryId)) {
            const subCategoryIds = await getSubcategories(categoryId);
            query = query
                .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
                .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds);
        }

        const products = await query;

        const productIds = products.filter(p => p.HasTierPrices).map(p => p.Id);
        const tierPrices = await getTierPrices(productIds, user.roles);

        const processedProducts = products.reduce((acc, product) => {
            let imageUrl = null;
            if (product.PictureId && product.MimeType && product.SeoFilename) {
                imageUrl = generateImageUrl2(product.PictureId, product.MimeType, product.SeoFilename);
            }

            const existingProduct = acc.find(p => p.Id === product.Id);
            const price = product.HasTierPrices ? (tierPrices[product.Id] || product.Price) : product.Price;

            if (existingProduct) {
                existingProduct.Images.push(imageUrl);
            } else {
                acc.push({
                    Id: product.Id,
                    Name: product.Name,
                    Price: price,
                    FullDescription: product.FullDescription,
                    ShortDescription: product.ShortDescription,
                    OrderMinimumQuantity: product.OrderMinimumQuantity,
                    OrderMaximumQuantity: product.OrderMaximumQuantity,
                    AllowedQuantities: product.AllowedQuantities,
                    Stock: product.StockQuantity,
                    Images: [imageUrl],
                    total_count: product.total_count
                });
            }

            return acc;
        }, []);

        const totalProducts = processedProducts.length > 0 ? processedProducts[0].total_count : 0;

        return {
            totalProducts,
            totalPages: Math.ceil(totalProducts / size),
            pageNumber: page,
            pageSize: size,
            data: processedProducts
        };
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = "Error in searchProducts";
        throw error;
    }
}


export async function GetFlatCategories() {
    try {
        const result = await knex('Category')
            .select("*")
            .where({
                Deleted: 0,
                Published: 1
            })
            .orderBy('Name', 'asc')
        return result
    } catch (error) {
        console.error("Error deleting discount mapping:\n", error);
        throw error;
    }
}

export async function GetImmediateChildCategories(categoryId) {
    try {
        let result = await knex('Category')
            .select(
                'Category.*',
                'Picture.Id as PictureId',
                'Picture.MimeType',
                'Picture.SeoFilename'
            )
            .leftJoin('Picture', 'Category.PictureId', 'Picture.Id')
            .where('ParentCategoryId', categoryId)
            .where('Published', true)
            .where('Deleted', false);

        const categoriesWithImages = result.map(category => {
            const { PictureId, ...rest } = category;
            const imageUrl = PictureId
                ? generateImageUrl2(PictureId[0], category.MimeType, category.SeoFilename)
                : null;

            return {
                ...rest,
                ImageUrl: imageUrl
            };
        });

        return categoriesWithImages;
    } catch (error) {
        console.error("Error fetching child categories:\n", error);
        throw error;
    }
}

export async function getProductsFromCategories() {
    //? Fetches products from categoryId and all of it's children
    const subCategoryIds = await getSubcategories(categoryId);

    const query = knex.raw(`
            WITH RankedProducts AS (
                SELECT 
                    p.Id, p.Name, p.HasTierPrices, p.Price, p.FullDescription, p.ShortDescription,
                    p.OrderMinimumQuantity, p.OrderMaximumQuantity, p.StockQuantity, p.CreatedOnUTC,
                    ppm.PictureId, pic.MimeType, pic.SeoFilename,
                    ROW_NUMBER() OVER (PARTITION BY p.Id ORDER BY ppm.DisplayOrder) AS RowNum
                FROM Product p
                JOIN Product_Category_Mapping pcm ON p.Id = pcm.ProductId
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
                rp.PictureId, rp.MimeType, rp.SeoFilename,
                tc.total_count
            FROM RankedProducts rp
            CROSS JOIN TotalCount tc
            WHERE rp.RowNum = 1
            ORDER BY rp.Name
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
        `, [offset, size]);
}

export { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts };