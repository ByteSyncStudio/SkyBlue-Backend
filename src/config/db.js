import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        encrypt: true,
    },
};

async function getConnection() {
    try {
        const pool = await mssql.connect(config);
        return pool;
    } catch (err) {
        console.error('Database connection failed', err);
        throw err;
    }
}

export default getConnection;