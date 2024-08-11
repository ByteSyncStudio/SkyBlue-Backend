import knex from '../config/knex.js';

/**
 * Retrieves a list of category from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of category objects.
 */

//categories
async function listCategory() {
  return await knex('Category')
    .select([
      'Name'
    ]) // Limit the results to the top 100 category
}

export { listCategory };