import express from 'express';
import { login } from '../controllers/auth/loginController.js';
import { signUp } from '../controllers/auth/signupController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication related endpoints
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: 'string' }
 *               password: { type: 'string' }
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);


router.post('/signup', signUp);

export default router;