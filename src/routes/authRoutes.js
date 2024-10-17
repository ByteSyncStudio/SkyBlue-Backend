import express from 'express';
import { login } from '../controllers/auth/loginController.js';
import { signUp } from '../controllers/auth/signupController.js';
import { forgetPassword, saveNewPassword, validateResetToken } from '../controllers/auth/resetPasswordController.js';

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
 *               email: 
 *                 type: string
 *                 example: user@example.com
 *               password: 
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: 
 *                 type: string
 *                 example: John
 *               lastName: 
 *                 type: string
 *                 example: Doe
 *               email: 
 *                 type: string
 *                 example: user@example.com
 *               companyName: 
 *                 type: string
 *                 example: Example Inc.
 *               storeAddress: 
 *                 type: string
 *                 example: 456 Business Rd
 *               businessLicense: 
 *                 type: string
 *                 example: BL123456
 *               streetAddress1: 
 *                 type: string
 *                 example: 123 Main St
 *               streetAddress2: 
 *                 type: string
 *                 example: Apt 4B
 *               zipCode: 
 *                 type: string
 *                 example: 12345
 *               city: 
 *                 type: string
 *                 example: Anytown
 *               country: 
 *                 type: string
 *                 example: USA
 *               state: 
 *                 type: string
 *                 example: CA
 *               phone: 
 *                 type: string
 *                 example: 123-456-7890
 *               password: 
 *                 type: string
 *                 example: password123
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Successful signup
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/signup', signUp);

router.post('/forget-password', forgetPassword);
router.get('/validate-reset-token', validateResetToken);
router.post('/save-new-password', saveNewPassword);

export default router;