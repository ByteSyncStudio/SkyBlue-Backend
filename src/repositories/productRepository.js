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


async function listProductsFromCategory(category) {
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
      .whereIn('Product_Category_Mapping.CategoryId', subCategoryIds);

    return products;
  } catch (error) {
    console.error('Error in listProductsFromCategory:', error);
    throw error;
  }
}


/**
 Original Work
 */

// Products from categories
// async function listProductsFromCategory(category) {
//   // const [{ ParentCategoryId }] = await knex('Category')
//   const [{ Id: ParentCategoryId }] = await knex('Category')
//     .select('Id')
//     .where('Name', category);
//   console.log('Category Id: ' + ParentCategoryId);

//   const productIds = await knex('Product_Category_Mapping')
//     .select('ProductId')
//     .where('CategoryId', ParentCategoryId)
//     .then(rows => rows.map(row => row.ProductId));

//   console.log("Total products: " + productIds.length)

//   const products = await knex('Product')
//     .select([
//       'Name',
//       'Price',
//       'FullDescription',
//       'ShortDescription',
//       'OrderMinimumQuantity',
//       'OrderMaximumQuantity'
//     ])
//     .whereIn('Id', productIds);

//   return products;
// }

export { listCategory, listProductsFromCategory };