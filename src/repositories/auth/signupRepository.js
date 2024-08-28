import knex from '../../config/knex.js';
import crypto from 'crypto';

/**
 * Creates a new user in the 'Customer' table.
 * 
 * @param {Object} user - The user object containing user details.
 * @param {Object} trx - The transaction object.
 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created user.
 */
export const createUser = async (user, trx) => {
    try {
        const [userId] = await trx('Customer').insert({
            CustomerGuid: generateGuid(),
            Email: user.email,
            Username: user.email,
            Active: 0, //* Set to 0 initially
            CreatedOnUtc: new Date(),
            LastActivityDateUtc: new Date(),
            RegisteredInStoreId: 3, //? StoreId for Skyblue Wholesale is always 3
            BillingAddress_Id: user.addressId,
            ShippingAddress_Id: user.addressId,
            IsTaxExempt: false, //? Its always false
            AffiliateId: 0, //? Always 0
            VendorId: 0, //? Always 0
            HasShoppingCartItems: 0, //* Set to 0 as default
            RequireReLogin: 0, //? Handled by frontend using token
            FailedLoginAttempts: 0, //? Initially set to 0 (Wont ever need to track this tbh)
            Deleted: 0, //* Modifiable later
            IsSystemAccount: 0, //? Will remain 0 (Wont ever need a system account)
            IsApproved: 0, //* Set to 0 while awaiting approval

        }).returning('Id');
        return userId.Id;
    } catch (error) {
        console.error("Error creating user:\n", error);
        throw error;
    }
};

/**
 * Creates a new address in the 'Address' table.
 * 
 * @param {Object} address - The address object containing address details.
 * @param {Object} trx - The transaction object.
 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created address.
 */
export const createAddress = async (address, trx) => {
    try {
        const [addressId] = await trx('Address').insert({
            FirstName: address.firstName,
            LastName: address.lastName,
            Email: address.email,
            Company: address.companyName,
            Address1: address.streetAddress1,
            Address2: address.streetAddress2,
            ZipPostalCode: address.zipCode,
            City: address.city,
            CountryId: await getCountryId(address.country, trx),
            StateProvinceId: await getStateProvinceId(address.state, trx),
            PhoneNumber: address.phone,
            CreatedOnUtc: new Date()
        }).returning('Id');
        return addressId.Id;
    } catch (error) {
        console.error("Error creating address:\n", error);
        throw error;
    }
};

/**
 * Creates a new customer password in the 'CustomerPassword' table.
 * 
 * @param {Object} passwordData - The password data object containing customer ID and password.
 * @param {Object} trx - The transaction object.
 * @returns {Promise<void>}
 */
export const createCustomerPassword = async (passwordData, trx) => {
    try {
        const salt = crypto.randomBytes(6).toString('base64').slice(0, 7) + '=';
        const hashedPassword = crypto.createHash('sha1').update(passwordData.password + salt).digest('hex').toUpperCase();

        await trx('CustomerPassword').insert({
            CustomerId: passwordData.customerId,
            Password: hashedPassword,
            PasswordFormatId: 1, //? Always 1
            PasswordSalt: salt,
            CreatedOnUtc: new Date()
        });

    } catch (error) {
        console.error("Error creating customer password:\n", error);
        throw error;
    }
};

/**
 * Assigns the default role to a customer.
 * 
 * @param {number} customerId - The ID of the customer.
 * @param {Object} trx - The transaction object.
 * @returns {Promise<void>}
 */
export const assignDefaultRole = async (customerId, trx) => {
    try {
        await trx('Customer_CustomerRole_Mapping').insert({
            Customer_Id: customerId,
            CustomerRole_Id: 3 // Assuming 3 is the ID for "Registered" role
        });
    } catch (error) {
        console.error("Error assigning default role:\n", error);
        throw error;
    }
};

export const storeDocuments = async (info, trx) => {
    try {
        for (const fileName of info.value) {
            await trx('GenericAttribute').insert({
                EntityId: info.customerId,
                KeyGroup: 'Customer',
                Key: info.key,
                Value: fileName,
                StoreId: info.storeId
            });
        }
    } catch (error) {
        console.error("Error storing additional information:\n", error);
        throw error;
    }
}

/**
 * Stores additional information in the 'GenericAttribute' table.
 * 
 * @param {Object} info - The information object containing customer ID and business license.
 * @param {Object} trx - The transaction object.
 * @returns {Promise<void>}
 */
// export const storeAdditionalInfo = async (info, trx) => {
//     try {
//         await trx('GenericAttribute').insert({
//             EntityId: info.customerId,
//             KeyGroup: 'Customer',
//             Key: 'BusinessLicense',
//             Value: info.businessLicense,
//             StoreId: 0
//         });
//     } catch (error) {
//         console.error("Error storing additional information:\n", error);
//         throw error;
//     }
// };

// Helper functions
async function getCountryId(countryName, trx) {
    const country = await trx('Country').where('Name', countryName).first();
    return country ? country.Id : null;
}

async function getStateProvinceId(stateName, trx) {
    const state = await trx('StateProvince').where('Name', stateName).first();
    return state ? state.Id : null;
}

function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
