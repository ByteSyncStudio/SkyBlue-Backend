import { createAddress, createUser, createCustomerPassword, assignDefaultRole, storeDocuments } from '../../repositories/auth/signupRepository.js';
import knex from '../../config/knex.js';
import multer from 'multer';
import { uploadFile } from '../../config/ftpsClient.js';
import fs from 'fs/promises';

const upload = multer({ dest: 'uploads/' })

export const signUp = [
    upload.array('documents'),
    async (req, res) => {
    const {
        firstName, lastName, email, companyName, storeAddress, businessLicense,
        streetAddress1, streetAddress2, zipCode, city, country, state, phone, password
    } = req.body;

    const files = req.files;

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

            // 5. Upload images to FTPS server (IONOS)
            if (files && files.length > 0) {
                const fileLinks = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExtension = file.mimetype.split('/')[1];
                    const fileName = `${customerId}_${i + 1}.${fileExtension}`;
                    const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/ForApproval/${fileName}`;
                    await uploadFile(file.path, remotePath);
                    fileLinks.push(fileName);

                    await fs.unlink(file.path);
                }

                await storeDocuments({
                    customerId,
                    key: 'DocumentsForApproval',
                    value: fileLinks,
                    storeId: 3
                }, trx);
            }

            res.status(201).json({ message: 'Signup successful. Awaiting admin approval.' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during signup.' });
    }

}];
