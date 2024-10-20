import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv'

dotenv.config();

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
 * Reads the Welcome HTML template.
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
    template = template.replace('{{domain}}', process.env.DOMAIN)
    return template;
}

/**
 * Reads and populates the Order Placed HTML template.
 * 
 * @param {Object} orderData - The order data to populate the template.
 * @returns {Promise<string>} - The populated HTML content.
 */
export async function getOrderPlacedEmailTemplate(orderData) {
    const templatePath = path.resolve('src/templates/html/orderplaced.html');
    let template = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders with actual order data
    template = template.replace('{{OrderId}}', orderData.order.Id);
    template = template.replace('{{Email}}', orderData.customerEmail);

    let productRows = '';
    orderData.orderItems.forEach(item => {
        productRows += `
            <tr>
                <td style="padding: 12px 30px; border-bottom: 1px solid #e8e8e8; color: #555;">${item.ProductName}</td>
                <td style="padding: 12px 30px; border-bottom: 1px solid #e8e8e8; text-align: center; color: #555;">${item.UnitPriceInclTax}</td>
                <td style="padding: 12px 30px; border-bottom: 1px solid #e8e8e8; text-align: center; color: #555;">${item.Quantity}</td>
                <td style="padding: 12px 30px; border-bottom: 1px solid #e8e8e8; text-align: right; color: #555;">${item.PriceInclTax}</td>
            </tr>
        `;
    });

    template = template.replace('{{ProductRows}}', productRows);
    template = template.replace('{{SubTotal}}', orderData.order.OrderSubtotalInclTax);
    template = template.replace('{{Tax}}', orderData.order.OrderTax);
    template = template.replace('{{Discount}}', orderData.order.OrderDiscount);
    template = template.replace('{{GrandTotal}}', orderData.order.OrderTotal);

    return template;
}