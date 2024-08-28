import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Customer API',
            version: '1.0.0',
        },
        tags: [
            { name: 'Auth', description: 'Authentication related endpoints' },
            { name: 'Admin', description: 'Admin related endpoints' },
            { name: 'Product', description: 'Product related endpoints' },
            { name: 'Cart', description: 'Cart related endpoints' },
        ],
    },
    apis: ['./src/routes/*.js', './src/routes/admin/*.js'],
};

const specs = swaggerJsdoc(options);

export default (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};