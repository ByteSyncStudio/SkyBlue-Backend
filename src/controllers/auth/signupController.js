import { createAddress, createUser, createCustomerPassword, assignDefaultRole, storeDocuments, checkEmailExists } from '../../repositories/auth/signupRepository.js';
import knex from '../../config/knex.js';
import multer from 'multer';
import { queueFileUpload } from '../../config/ftpsClient.js';
import { SendEmail } from '../../config/emailService.js';
import { getAckEmailTemplate } from '../../utils/emailTemplates.js';


const upload = multer({ dest: 'uploads/' })

export const signUp = [
    upload.array('documents'),
    async (req, res) => {
        const {
            firstName, lastName, email, companyName, storeAddress, businessLicense,
            streetAddress1, streetAddress2, zipCode, city, country, state, phone, password
        } = req.body;

        const files = req.files;

        let customerId;
        try {
            // Start a transaction
            await knex.transaction(async (trx) => {
                // 1. Create Address
                const addressId = await createAddress({
                    firstName, lastName, email, companyName, streetAddress1, streetAddress2, zipCode, city, country, state, phone
                }, trx);

                // 2. Create Customer
                customerId = await createUser({
                    email, addressId
                }, trx);

                // 3. Create CustomerPassword
                await createCustomerPassword({
                    customerId, password
                }, trx);

                // 4. Assign default role (e.g., "Registered")
                await assignDefaultRole(customerId, trx);

                // 5. Store document information
                if (files && files.length > 0) {
                    const fileLinks = files.map((file, index) => {
                        const fileExtension = file.mimetype.split('/')[1];
                        return `${customerId}_${index + 1}.${fileExtension}`;
                    });

                    await storeDocuments({
                        customerId,
                        key: 'DocumentsForApproval',
                        value: fileLinks,
                        storeId: 3
                    }, trx);
                }
            });

            // Send immediate response
            res.status(201).json({ message: 'Signup successful. Documents are being processed. Awaiting admin approval.' });

            // Queue file uploads after sending the response
            if (files && files.length > 0) {
                console.log('Uploading files for new customer:', customerId);
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExtension = file.mimetype.split('/')[1];
                    const fileName = `${customerId}_${i + 1}.${fileExtension}`;
                    const remotePath = `/acc1845619052/SkyblueWholesale/Content/Images/ForApproval/${fileName}`;
                    queueFileUpload(file.path, remotePath);
                }
            }

            // Send welcome email
            const emailTemplate = await getAckEmailTemplate();
            await SendEmail(email, 'Awaiting admin approval', emailTemplate);

        } catch (error) {
            console.error('Error during signup:', error);
            if (error.message === 'Email already exists') {
                res.status(400).json({ message: 'Email already exists' });
            } else {
                // Only send error response if headers haven't been sent
                if (!res.headersSent) {
                    res.status(500).json({ message: 'An error occurred during signup.' });
                }
            }
        }
    }];