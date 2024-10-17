import knex from '../../config/knex.js';
import crypto from 'crypto';

const resetTokens = new Map();

/**
 * Checks if an email exists in the 'Customer' table.
 * 
 * @param {string} email - The email to check.
 * @returns {Promise<Object>} - A promise that resolves to the user object if found, otherwise null.
 */
export const checkEmailExists = async (email) => {
    try {
        return await knex('Customer')
            .where({ Email: email })
            .first();
    } catch (error) {
        console.error("Error checking if email exists:\n", error);
        throw error;
    }
};

/**
 * Stores a reset token in-memory.
 * 
 * @param {string} email - The email associated with the token.
 * @param {string} token - The reset token.
 */
export const storeResetToken = async (email, token) => {
    resetTokens.set(email, token);
};

/**
 * Retrieves a reset token from in-memory storage.
 * 
 * @param {string} email - The email associated with the token.
 * @returns {string} - The reset token.
 */
export const getResetToken = async (email) => {
    return resetTokens.get(email);
};

/**
 * Removes a reset token from in-memory storage.
 * 
 * @param {string} email - The email associated with the token.
 */
export const removeResetToken = async (email) => {
    resetTokens.delete(email);
};

/**
 * Updates the password for a user in the 'CustomerPassword' table.
 * 
 * @param {string} email - The email of the user.
 * @param {string} newPassword - The new password to set.
 */
export const updatePassword = async (email, newPassword) => {
    const newSalt = crypto.randomBytes(6).toString('base64').slice(0, 7) + '=';
    const newHashedPassword = crypto.createHash('sha1').update(newPassword + newSalt).digest('hex').toUpperCase();

    try {
        await knex.transaction(async (trx) => {
            const user = await trx('Customer').where({ Email: email }).first();
            if (!user) throw new Error('User not found');

            await trx('CustomerPassword').insert({
                CustomerId: user.Id,
                Password: newHashedPassword,
                PasswordSalt: newSalt,
                CreatedOnUtc: new Date().toISOString(),
                PasswordFormatId: 1,
            });
        });
    } catch (error) {
        console.error('Error updating password:', error.message);
        throw new Error('Failed to update password. Please try again later.');
    }
};