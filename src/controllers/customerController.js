import { listCustomers } from "../repositories/customerRepository.js";

/**
 * @swagger
 * /customers/top100:
 *   get:
 *     summary: Retrieve a list of customers
 *     responses:
 *       200:
 *         description: A list of customers.
 */
async function getCustomers(req, res) {
    try {
        const customers = await listCustomers();
        res.json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}


export { getCustomers };