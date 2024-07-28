import Knex from 'knex';
import knexConfig from '../config/db.js';

const knex = Knex(knexConfig);

export default knex;