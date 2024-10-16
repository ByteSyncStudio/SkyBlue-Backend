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