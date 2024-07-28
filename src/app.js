import express from 'express';
import fileRoutes from './routes/fileRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import swaggerSetup from './config/swagger.js';

const app = express();

// Setup Swagger for API documentation; See endpoint: /api-docs
swaggerSetup(app);

app.use('/', fileRoutes);
app.use('/customers', customerRoutes);

export default app;