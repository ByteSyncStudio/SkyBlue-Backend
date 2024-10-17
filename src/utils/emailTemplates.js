import fs from 'fs/promises';
import path from 'path';

/**
 * Reads the Ack HTML template.
 * 
 * @returns {Promise<string>} - The HTML content.
 */
export async function getAckEmailTemplate() {
    const templatePath = path.resolve('src/templates/html/ack.html');
    return await fs.readFile(templatePath, 'utf-8');
}

/**
 * Reads the Weclome HTML template.
 * 
 * @returns {Promise<string>} - The HTML content.
 */
export async function getWelcomeEmailTemplate() {
    const templatePath = path.resolve('src/templates/html/welcome.html')
    return await fs.readFile(templatePath, 'utf-8')
}

export async function getResetPasswordEmailTemplate(token) {
    const templatePath = path.resolve('src/templates/html/resetPassword.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = template.replace('{{token}}', token);
    template = template.replace('{{domain}}', 'http://localhost:5173')
    return template;
}