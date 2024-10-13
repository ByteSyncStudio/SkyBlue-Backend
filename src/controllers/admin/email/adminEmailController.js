import { SendEmail } from "../../../config/emailService.js";

export async function sendEmail(req, res) {
    const { to, subject, text } = req.body;

    try {
        await SendEmail(to, subject, text);
        res.status(200).send({ success: true, message: 'Email send successfully. ' })
    } catch (error) {
        console.error('Error in sending mail:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}