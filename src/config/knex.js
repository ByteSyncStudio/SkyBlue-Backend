import Knex from 'knex';
import knexConfig from '../config/db.js';
import colors from 'colors';

const knex = Knex(knexConfig);

// Test the connection
knex.raw('SELECT 1')
  .then(() => {
    console.log(`Connected to DB: ${knexConfig.connection.database} at ${knexConfig.connection.host} as ${knexConfig.connection.user}`.cyan.underline.bold);
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

export default knex;