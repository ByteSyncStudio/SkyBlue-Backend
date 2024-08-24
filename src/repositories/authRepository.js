import knex from '../config/knex.js';

/**
 * Fetches a user by their email from the 'Customer' table.
 * 
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the user object if found, otherwise null.
 */
export const getUserByEmail = async (email) => {
    try {
        return await knex('Customer')
            .where({ Email: email })
            .first();
    } catch (error) {
        console.error("Error fetching user by email:\n", error);
    }
};

/**
 * Fetches the most recent password record for a given customer ID from the 'CustomerPassword' table.
 * 
 * @param {number} customerId - The ID of the customer whose password record to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the most recent password record if found, otherwise null.
 */
export const getPasswordRecordByCustomerId = async (customerId) => {
    try {
        return await knex('CustomerPassword')
            .where({ CustomerId: customerId })
            .orderBy('CreatedOnUtc', 'desc')
            .first();
    } catch (error) {
        console.error("Error fetching password record by customer ID:\n", error);
    }
};

export const getUserRoles = async (userId) => {
    try {
        return await knex('Customer_CustomerRole_Mapping')
            .join('CustomerRole', 'Customer_CustomerRole_Mapping.CustomerRole_Id', '=', 'CustomerRole.Id')
            .where('Customer_CustomerRole_Mapping.Customer_Id', userId)
            .select('CustomerRole.Name', 'CustomerRole.SystemName');

    } catch (error) {
        console.error('Error fetching user roles:\n', error);
        throw error;
    }
}