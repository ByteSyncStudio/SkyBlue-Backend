import knex from '../config/knex.js';
import cache from '../config/cache.js'
import { generateImageUrl } from '../utils/imageUtils.js';


/**
 * Retrieves a list of specific categories from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */
async function listCategory() {
  const specificCategories = ['Beverages', 'Candy', 'Essentials', 'Snacks']
  try {
    const cacheKey = 'categories';
    const cachedCategories = cache.get(cacheKey);

    if (cachedCategories) {
      return cachedCategories;
    }

    const categories = await knex('Category')
      .select(['Id', 'Name'])
      .whereIn('Name', specificCategories)
      .orderBy('Id');

    categories.push({ Id: -1, Name: 'All Items' })

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
 * Helper function to fetch and process products.
 * 
 * @param {Object} query - The Knex query object to fetch products.
 * @param {Function} [processingFunction=null] - Optional function to further process each product.
 * @returns {Promise<Array>} A promise that resolves to an array of processed product objects.
 */
async function fetchAndProcessProducts(query, processingFunction = null) {
  const products = await query;

  return products.map(product => {
    let image = null;
    if (product.PictureId) {
      image = generateImageUrl(product.PictureId, product.MimeType);
    }

    const processedProduct = {
      Id: product.Id,
      Name: product.Name,
      Price: product.Price,
      FullDescription: product.FullDescription,
      ShortDescription: product.ShortDescription,
      OrderMinimumQuantity: product.OrderMinimumQuantity,
      OrderMaximumQuantity: product.OrderMaximumQuantity,
      Stock: product.Stock,
      Image: image,
      total_count: product.total_count
    };

    return processingFunction ? processingFunction(processedProduct, product) : processedProduct;
  });
}

/**
 * Retrieves a list of products from the specified category with pagination.
 * 
 * @param {string} category - The name of the category.
 * @param {number} page - The page number.
 * @param {number} size - The number of items per page.
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
async function listProductsFromCategory(categoryId, page = 1, size = 10) {
  const cacheKey = `products_${categoryId}_${page}_${size}`;
  const cachedProducts = cache.get(cacheKey);

  if (cachedProducts) {
    return cachedProducts;
  }

  try {
    const offset = (page - 1) * size;

    if (categoryId === -1) {
      categoryId = 0;
    }

    const subCategoryIds = await getSubcategories(categoryId);

    const query = knex('Product')
      .select([
        'Product.Id',
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity',
        'Product_Picture_Mapping.PictureId',
        'Product.Stock',
        'Picture.MimeType',
        knex.raw('COUNT(*) OVER() AS total_count')
      ])
      .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds)
      .orderBy('Product.Name')
      .limit(size)
      .offset(offset);

    const processedProducts = await fetchAndProcessProducts(query);

    const totalProducts = processedProducts.length > 0 ? processedProducts[0].total_count : 0;

    const response = {
      totalProducts,
      totalPages: Math.ceil(totalProducts / size),
      pageNumber: page,
      pageSize: size,
      data: processedProducts
    }

    cache.set(cacheKey, response);
    return response;

  } catch (error) {
    console.error('Error in listProductsFromCategory:', error);
    throw error;
  }
}

/**
 * Retrieves a list of best-selling products sorted by a specified criterion.
 * 
 * @param {string} sortBy - The criterion to sort by ('quantity' or 'amount').
 * @param {number} size - The number of items to retrieve.
 * @returns {Promise<Array>} A promise that resolves to an array of best-selling product objects.
 */
async function listBestsellers(sortBy, size) {
  try {
    const cacheKey = `bestsellers_by_${sortBy}_${size}`;
    const cachedBestSellers = cache.get(cacheKey);

    if (cachedBestSellers) {
      return cachedBestSellers;
    }

    const orderColumn = sortBy === 'quantity' ? 'TotalQuantity' : 'TotalAmount';
    const topProducts = await knex('OrderItem')
      .select('ProductId')
      .sum('Quantity as TotalQuantity')
      .sum('PriceExclTax as TotalAmount')
      .groupBy('ProductId')
      .orderBy(orderColumn, 'desc')
      .limit(size);

    const productIds = topProducts.map(i => i.ProductId);

    const query = knex('Product')
      .select([
        'Product.Id',
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity',
        'Product_Picture_Mapping.PictureId',
        'Product.Stock',
        'Picture.MimeType'
      ])
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .whereIn('Product.Id', productIds);

    const processedProducts = await fetchAndProcessProducts(query, (processedProduct, product) => {
      const topProduct = topProducts.find(p => p.ProductId === product.Id);
      return {
        Quantity: topProduct.TotalQuantity,
        Amount: topProduct.TotalAmount,
        data: processedProduct
      };
    });

    cache.set(cacheKey, processedProducts);
    return processedProducts;
  }
  catch (error) {
    error.statusCode = 500;
    error.message = "Error in BestSellers"
    throw error;
  }
}


/**
 * Retrieves a list of new arrival products with pagination.
 * 
 * @param {number} size - The number of items per page.
 * @returns {Promise<Array>} A promise that resolves to an array of new arrival product objects.
 */
async function listNewArrivals(size) {
  try {
    const query = knex('Product')
      .select([
        'Product.CreatedonUTC',
        'Product.Id',
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity',
        'Product_Picture_Mapping.PictureId',
        'Product.Stock',
        'Picture.MimeType'
      ])
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .orderBy('Product.CreatedonUTC', 'desc')
      .limit(size);

    return await fetchAndProcessProducts(query);
  }
  catch (error) {
    error.statusCode = 500;
    error.message = "Error in NewArrivals"
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
async function listSearchProducts(categoryId, searchTerm, page = 1, size = 10) {
  try {
    const offset = (page - 1) * size;

    let query = knex('Product')
      .select([
        'Product.Id',
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity',
        'Product_Picture_Mapping.PictureId',
        'Product.Stock',
        'Picture.MimeType',
        knex.raw('COUNT(*) OVER() AS total_count')
      ])
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .where('Product.Name', 'like', `%${searchTerm}%`)
      .orderBy('Product.Name')
      .limit(size)
      .offset(offset);

    if ([36, 111, 189].includes(categoryId)) {
      const subCategoryIds = await getSubcategories(categoryId);
      query = query
        .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
        .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds);
    }

    const processedProducts = await fetchAndProcessProducts(query);

    const totalProducts = processedProducts.length > 0 ? processedProducts[0].total_count : 0;

    return {
      totalProducts,
      totalPages: Math.ceil(totalProducts / size),
      pageNumber: page,
      pageSize: size,
      data: processedProducts
    };

  } catch (error) {
    error.statusCode = 500
    error.message = "Error in searchProducts"
    throw error;
  }
}



export { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts };