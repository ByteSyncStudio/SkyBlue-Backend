import { getUserByEmail, getPasswordRecordByCustomerId, getUserRoles} from '../../repositories/auth/loginRepository.js';
import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '100h';


export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Fetch user by email to get their ID
        const user = await getUserByEmail(email);
        console.log(user)
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if(!user.IsApproved) {
            return res.status(401).json({ message: 'Account awaiting approval' });
        }

        if (!user.Active) {
            return res.status(401).json({ message: 'Account Inactive' });
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
            const roles = await getUserRoles(user.Id);

            // Return a JWT token
            const token = jsonwebtoken.sign(
                {
                    email: email,
                    id: user.Id,
                    roles: roles
                },
                JWT_SECRET, { expiresIn: JWT_EXPIRATION });

            return res.status(200).json({ message: 'Login successful', token });

        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};
