import express from 'express';
import tableRoutes from './routes/tableRoutes.js';

const app = express();

app.use('/', tableRoutes);

export default app;