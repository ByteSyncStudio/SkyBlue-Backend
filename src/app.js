import express from 'express';
import swaggerSetup from './config/swagger.js';
import fileRoutes from './routes/fileRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Parse JSON
app.use(express.json());

// Setup Swagger for API documentation; See endpoint: /api-docs
swaggerSetup(app);

// Endpoints
app.use('/', fileRoutes);
app.use('/customers', customerRoutes);
app.use('/auth', authRoutes);


// (Loose) Error Catcher
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    console.error('Error message:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
