import dotenv from 'dotenv';

dotenv.config();

const config = {
  client: 'mssql',
  connection: {
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true,
    },
  },
  pool: {
    min: 2,
    max: 10,
  }
};

export default config;