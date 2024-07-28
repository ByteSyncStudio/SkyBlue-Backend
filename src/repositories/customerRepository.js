import knex from '../config/knex.js';

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
    .limit(100);
}

export { listCustomers };