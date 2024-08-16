import knex from '../config/knex.js';
import cache from '../config/cache.js'

/**
 * Retrieves a list of categories from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */
async function listCategory() {
  try {
    const categories = await knex('Category')
      .select(['Id', 'Name'])
      .where('ParentCategoryId', 0)
      .orderBy('Id');
    return categories;
  } catch (error) {
    console.error('Error in listCategory:', error);
    throw new Error('Database error');
  }
}

/**
 * Retrieves all subcategories of a given category, including the category itself.
 * 
 * @param {number} categoryId - The ID of the category.
 * @returns {Promise<Array>} A promise that resolves to an array of subcategory IDs.
 */
async function getSubcategories(categoryId) {
  const cacheKey = `subcategories_${categoryId}`;
  const cachedSubcategories = cache.get(cacheKey);

  if (cachedSubcategories) {
    return cachedSubcategories;
  }

  // Get all subcategories (including the category itself)
  const subCategories = await knex('Category')
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
    .select('Id');

  const subCategoryIds = subCategories.map(cat => cat.Id);

  // Setting for future cache
  cache.set(cacheKey, subCategoryIds);

  return subCategoryIds;
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
    // Calculate offset
    const offset = (page - 1) * size;

    const subCategoryIds = await getSubcategories(categoryId);

    // Fetch products with their images in a single query
    const products = await knex('Product')
      .select([
        'Product.Id',
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity',
        'Product_Picture_Mapping.PictureId',
        'Picture.MimeType'
      ])
      .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds)
      .orderBy('Product.Name')
      .limit(size)
      .offset(offset);


    // Process the results
    const processedProducts = products.map(product => {
      let image = null;
      if (product.PictureId) {
        const formattedId = product.PictureId.toString().padStart(7, '0');
        const fileExtension = product.MimeType ? product.MimeType.split('/')[1] : 'jpg';
        image = `https://skybluewholesale.com/content/images/${formattedId}_0.${fileExtension}`;
      }

      return {
        Id: product.Id,
        Name: product.Name,
        Price: product.Price,
        FullDescription: product.FullDescription,
        ShortDescription: product.ShortDescription,
        OrderMinimumQuantity: product.OrderMinimumQuantity,
        OrderMaximumQuantity: product.OrderMaximumQuantity,
        Image: image
      };
    });

    cache.set(cacheKey, processedProducts);

    return processedProducts;

  } catch (error) {
    console.error('Error in listProductsFromCategory:', error);
    throw error;
  }
}


export { listCategory, listProductsFromCategory };