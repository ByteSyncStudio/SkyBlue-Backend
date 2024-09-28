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

async function getTierPrices(productIds, userRoles) {
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
    const specificCategories = getSpecificCategories();
    const miscCategory = getMiscellaneousName();
    try {
        const cacheKey = 'categories';
        const cachedCategories = cache.get(cacheKey);

        if (cachedCategories) {
            return cachedCategories;
        }

        const categories = await knex('Category')
            .select(['Id', 'Name'])
            .whereIn('Id', Array.from(specificCategories.keys()))
            .orderBy('Id');


        // Add 'All Items' where we dont want to specifically categorize
        categories.push({ Id: -1, Name: miscCategory.get(-1) });

        cache.set(cacheKey, categories);
        return categories;

    } catch (error) {
        error.statusCode = 500;
        error.message = "List Category Error";
        throw error;
    }
}

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
async function listProductsFromCategory(categoryId, page = 1, size = 10, user) {
    //! CACHING CHANGE
    const cacheKey = `products_${categoryId}_${page}_${size}_${user.roles.map(r => r.Id).join('_')}`;
    const cachedProducts = cache.get(cacheKey);

    if (cachedProducts) {
        return cachedProducts;
    }

    try {
        const offset = (page - 1) * size;

        let categoryName = "";
        if (categoryId === -1) {
            categoryName = getMiscellaneousName().get(-1) || "";
        } else {
            categoryName = getSpecificCategories().get(categoryId) || "";
        }

        if (categoryId === -1) {
            categoryId = 0;
        }

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
                Stock: product.StockQuantity,
                Images: [imageUrl],
                total_count: product.total_count,
                CreatedOnUTC: product.CreatedOnUTC
            };
        });
        //
        const totalProducts = processedProducts.length > 0 ? processedProducts[0].total_count : 0;

        console.log('No. :' + processedProducts.length)
        const response = {
            categoryName: categoryName,
            totalProducts,
            totalPages: Math.ceil(totalProducts / size),
            pageNumber: page,
            pageSize: size,
            data: processedProducts
        };

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
async function listSearchProducts(categoryId, searchTerm, page = 1, size = 10, user) {
    try {
        const offset = (page - 1) * size;

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
                'product.StockQuantity',
                'Picture.MimeType',
                'Picture.SeoFilename',
                knex.raw('COUNT(*) OVER() AS total_count')
            ])
            .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
            .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
            .where('Product.Name', 'like', `%${searchTerm}%`)
            .where('Product.Published', true)
            .where('Product.Deleted', false)
            .orderBy('Product.Name')
            .limit(size)
            .offset(offset);

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
        console.error(error)
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


export { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts };