import { getUserByEmail, getPasswordRecordByCustomerId } from '../repositories/authRepository.js';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '1h';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export const login = async (req, res, next) => {
    try {
        console.log(req.body);
        const { email, password } = req.body;

        // Fetch user by email to get their ID
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Using the user's ID, fetch their most recent password record
        const passwordRecord = await getPasswordRecordByCustomerId(user.Id);
        if (!passwordRecord) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Hash the password + salt
        const hashedPassword = crypto.createHash('sha1').update(password + passwordRecord.PasswordSalt).digest('hex').toUpperCase();

        // Compare our Hash to stored hash
        if (hashedPassword === passwordRecord.Password) {
            
            // Return a JWT token
            const token = jsonwebtoken.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
            return res.status(200).json({ message: 'Login successful', token });

        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};