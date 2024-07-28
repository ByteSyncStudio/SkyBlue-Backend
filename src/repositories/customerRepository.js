import getConnection from "../config/db.js";

async function listCustomers() {
    const pool = await getConnection();
    const result = await pool.request().query(`
        SELECT TOP (100) [Id], [CustomerGuid], [Username], [Email], [EmailToRevalidate], 
        [AdminComment], [IsTaxExempt], [AffiliateId], [VendorId], [HasShoppingCartItems], 
        [RequireReLogin], [FailedLoginAttempts], [CannotLoginUntilDateUtc], [Active], 
        [Deleted], [IsSystemAccount], [SystemName], [LastIpAddress], [CreatedOnUtc], 
        [LastLoginDateUtc], [LastActivityDateUtc], [RegisteredInStoreId], [BillingAddress_Id], 
        [ShippingAddress_Id]
        FROM [dbo].[Customer]
    `);
    return result.recordset;
}

export { listCustomers };