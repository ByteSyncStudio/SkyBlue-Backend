import { createAddress, createUser, createCustomerPassword, assignDefaultRole } from '../../repositories/auth/signupRepository.js';
import knex from '../../config/knex.js';

export const signUp = async (req, res) => {
    const {
        firstName, lastName, email, companyName, storeAddress, businessLicense,
        streetAddress1, streetAddress2, zipCode, city, country, state, phone, password
    } = req.body;

    try {
        // Start a transaction
        await knex.transaction(async (trx) => {
            // 1. Create Address
            const addressId = await createAddress({
                firstName, lastName, email, companyName, streetAddress1, streetAddress2, zipCode, city, country, state, phone
            }, trx);

            // 2. Create Customer
            const customerId = await createUser({
                email, addressId
            }, trx);

            // 3. Create CustomerPassword
            await createCustomerPassword({
                customerId, password
            }, trx);

            // 4. Assign default role (e.g., "Registered")
            await assignDefaultRole(customerId, trx);

            //! 5. Store additional information (e.g., business license) in GenericAttribute (NOT NEEDED)
            // await storeAdditionalInfo({
            //     customerId, businessLicense
            // }, trx);

            res.status(201).json({ message: 'Signup successful. Awaiting admin approval.' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during signup.' });
    }
};
