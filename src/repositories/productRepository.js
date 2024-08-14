import knex from '../config/knex.js';

/**
 * Retrieves a list of category from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */


async function listCategory() {
  try {
    const categories = await knex('Category')
      .select(['Id', 'Name', 'ParentCategoryId'])
      .where('ParentCategoryId', 0)
      .orderBy('Id');
    return categories;
  } catch (error) {
    console.error('Error in listCategory:', error);
    throw new Error('Database error');
  }
}


// async function listCategory() {
//   try {
//     // Retrieve all root categories
//     const rootCategories = await knex('Category')
//       .select(['Id', 'Name', 'ParentCategoryId'])
//       .where('ParentCategoryId', 0)
//       .orderBy('Id');

//     // For each root category, find all subcategories and count products
//     const categoriesWithProductCount = await Promise.all(rootCategories.map(async (category) => {
//       const subCategories = await knex('Category')
//         .withRecursive('SubCategories', (qb) => {
//           qb.select('Id')
//             .from('Category')
//             .where('Id', category.Id)
//             .unionAll((qb) => {
//               qb.select('c.Id')
//                 .from('Category as c')
//                 .innerJoin('SubCategories as sc', 'c.ParentCategoryId', 'sc.Id');
//             });
//         })
//         .select('Id')
//         .from('SubCategories');

//       const subCategoryIds = subCategories.map(cat => cat.Id);

//       // Count products in these categories
//       const productCount = await knex('Product_Category_Mapping')
//         .whereIn('CategoryId', subCategoryIds)
//         .count('ProductId as count')
//         .first();

//       return {
//         ...category,
//         ProductCount: productCount.count
//       };
//     }));

//     // Sort categories by product count in descending order
//     categoriesWithProductCount.sort((a, b) => b.ProductCount - a.ProductCount);

//     return categoriesWithProductCount;
//   } catch (error) {
//     console.error('Error in listCategory:', error);
//     throw new Error('Database error');
//   }
// }

/**
 * Retrieves a list of products from the specified category with pagination.
 * 
 * @param {string} category - The name of the category.
 * @param {number} page - The page number.
 * @param {number} size - The number of items per page.
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
async function listProductsFromCategory(category, page = 1, size = 10) {
  try {
    // First, find the category ID
    const categoryResult = await knex('Category')
      .select('Id')
      .where('Name', category)
      .first();

    if (!categoryResult) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    const { Id: categoryId } = categoryResult;

    // Then, get all subcategories (including the category itself)
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
      .select('Id')
      .from('SubCategories');

    const subCategoryIds = subCategories.map(cat => cat.Id);

    // Calculate offset
    const offset = (page - 1) * size;

    // Finally, get all products in these categories
    const products = await knex('Product')
      .select([
        'Product.Name',
        'Product.Price',
        'Product.FullDescription',
        'Product.ShortDescription',
        'Product.OrderMinimumQuantity',
        'Product.OrderMaximumQuantity'
      ])
      .join('Product_Category_Mapping', 'Product.Id', 'Product_Category_Mapping.ProductId')
      .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds)
      .orderBy('Product.Name')
      .limit(size)
      .offset(offset);

    console.log('Page item count: ' + products.length)
    return products;
  } catch (error) {
    console.error('Error in listProductsFromCategory:', error);
    throw error;
  }
}


export { listCategory, listProductsFromCategory };