import { checkEmailExists, storeResetToken, getResetToken, removeResetToken, updatePassword } from '../../repositories/auth/resetPasswordRepository.js';
import { generateResetToken } from '../../utils/Token.js';
import { SendEmail } from '../../config/emailService.js';
import { getResetPasswordEmailTemplate } from '../../utils/emailTemplates.js';
import { verifyResetToken } from '../../utils/Token.js';

export async function forgetPassword(req, res) {
    const { email } = req.body;

    try {
        // Check if email exists
        const user = await checkEmailExists(email);
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Generate reset token
        const token = generateResetToken({ email });
        console.log(token)

        // Store token in-memory (for now)
        await storeResetToken(email, token);

        // Get email template
        const emailTemplate = await getResetPasswordEmailTemplate(token);

        // Send email
        const sentMail = await SendEmail(email, 'Reset Password', emailTemplate);
        console.log(sentMail)

        res.status(200).json({ message: 'Reset password email sent' });
    } catch (error) {
        console.error('Error during forget password:', error);
        res.status(500).json({ message: 'An error occurred during forget password.' });
    }
};

export async function validateResetToken(req, res) {
    const { token } = req.query;

    try {
        const decoded = verifyResetToken(token);
        const storedToken = await getResetToken(decoded.email);
        console.log(storedToken)

        if (storedToken !== token) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        res.status(200).json({ message: 'Token is valid' });
    } catch (error) {
        console.error('Error validating reset token:', error);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
}

export async function saveNewPassword(req, res) {
    const { token, newPassword } = req.body;

    try {
        const decoded = verifyResetToken(token);
        const storedToken = await getResetToken(decoded.email);

        if (storedToken !== token) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        await updatePassword(decoded.email, newPassword);
        await removeResetToken(decoded.email);

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error saving new password:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token signature' });
        }

        res.status(500).json({ message: 'An error occurred while updating the password.' });
    }
}