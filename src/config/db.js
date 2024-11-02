import dotenv from 'dotenv';

dotenv.config();

// const config = {
//   client: 'mssql',
//   connection: {
//     server: process.env.DB_SERVER,
//     database: process.env.DB_DATABASE,
//     uid: process.env.DB_USER,
//     pwd: process.env.DB_PASSWORD,
//     options: {
//       encrypt: true,
//       trustServerCertificate: true,
//       port: 1433 
//     },
//   },
//   pool: {
//     min: 2,
//     max: 10,
//   }
// };

const config = {
  client: 'mssql',
  connection: process.env.DB_CONNECTION_STRING,
  pool: {
    min: 2,
    max: 10,
  }
};

export default config;