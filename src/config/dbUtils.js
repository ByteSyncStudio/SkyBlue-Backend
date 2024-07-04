import getConnection from './db.js';

async function listTables() {
    const pool = await getConnection();
    const result = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    return result.recordset;
}

export { listTables };