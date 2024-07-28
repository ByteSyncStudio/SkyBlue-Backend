import knex from '../config/knex.js';

/**
 * Retrieves a list of customers from the database.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of customer objects.
 */
async function listCustomers() {
  return await knex('Customer')
    .select([
      'Id', 'CustomerGuid', 'Username', 'Email', 'EmailToRevalidate', 
      'AdminComment', 'IsTaxExempt', 'AffiliateId', 'VendorId', 'HasShoppingCartItems', 
      'RequireReLogin', 'FailedLoginAttempts', 'CannotLoginUntilDateUtc', 'Active', 
      'Deleted', 'IsSystemAccount', 'SystemName', 'LastIpAddress', 'CreatedOnUtc', 
      'LastLoginDateUtc', 'LastActivityDateUtc', 'RegisteredInStoreId', 'BillingAddress_Id', 
      'ShippingAddress_Id'
    ])
    .limit(100); // Limit the results to the top 100 customers
}

export { listCustomers };