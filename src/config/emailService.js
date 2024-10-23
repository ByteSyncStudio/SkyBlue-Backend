import nodemailer from 'nodemailer';
import dotenv from 'dotenv'
import { promisify } from 'util';

dotenv.config();

const delay = promisify(setTimeout);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER_SALES,
        pass: process.env.SMTP_PASS_SALES
    }
});

export async function SendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.SMTP_USER_SALES,
        to: to,
        subject: subject,
        html: text
    }
    try {
        let info = await transporter.sendMail(mailOptions);
        return info;

    } catch (error) {
        throw new Error('Error sending email: ' + error.message);
    }
};

export async function SendBulkEmails(emails, subject, text) {
    try {
        for (const email of emails) {
            await SendEmail(email, subject, text);
            await delay(1000); //? 1 second delay
        }
    } catch (error) {
        throw new Error('Error sending bulk emails: ' + error.message);
    }
}