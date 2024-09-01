import knex from '../config/knex.js';
import crypto from 'crypto';


export async function GetUserInfo(user) {
    const countries = [
        {
            id: 1,
            name: 'United States'
        },
        {
            id: 2,
            name: 'Canada'
        }
    ]

    return await knex('Address')
        .join('StateProvince', 'StateProvince.Id', '=', 'Address.StateProvinceId')
        .select([
            'Address.FirstName',
            'Address.LastName',
            'Address.Company',
            'Address.Address1',
            'Address.ZipPostalCode',
            'Address.City',
            'Address.CountryId',
            'Address.StateProvinceId',
            'StateProvince.Name as StateProvinceName',
            'Address.PhoneNumber'
        ])
        .where('Address.Email', user.email);
}

export async function ChangePassword(user, currentPassword, newPassword) {
    const { Password: storedPassword, PasswordSalt: storedSalt } = await knex('CustomerPassword')
        .select(['Password', 'PasswordSalt'])
        .where('CustomerId', user.id)
        .orderBy('CreatedOnUtc', 'desc')
        .first();

    const givenHashedPassword = crypto.createHash('sha1').update(currentPassword + storedSalt).digest('hex').toUpperCase();

    if (givenHashedPassword === storedPassword) {
        const newSalt = crypto.randomBytes(6).toString('base64').slice(0, 7) + '=';
        const newHashedPassword = crypto.createHash('sha1').update(newPassword + newSalt).digest('hex').toUpperCase();

        try {
            await knex.transaction(async trx => {
                await trx('CustomerPassword').insert({
                    CustomerId: user.id,
                    Password: newHashedPassword,
                    PasswordSalt: newSalt,
                    CreatedOnUtc: new Date().toISOString(),
                    PasswordFormatId: 1 // Always 1
                });
            });

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            console.error('Error updating password:', error.message);
            throw new Error('Failed to update password. Please try again later.');
        }
    } else {
        return { success: false, message: 'Current Password is incorrect', statusCode: 400 }
    }
}

export async function UpdateUserInfo(user, updatedFields) {
    try {
        // Remove the Email field if it exists in the updatedFields object
        if ('Email' in updatedFields) {
            delete updatedFields.Email;
        }

        // Check if there are any fields to update
        if (Object.keys(updatedFields).length === 0) {
            return { success: false, message: 'No fields to update', statusCode: 400 };
        }

        await knex.transaction(async trx => {
            await trx('Address')
                .where('Email', user.email)
                .update(updatedFields);
        });

        return { success: true, message: 'User info updated successfully' };
    } catch (error) {
        console.error('Error updating user info:', error.message);
        throw new Error('Failed to update user info. Please try again later.');
    }
}

export async function GetCountryList() {
    return await knex('Country')
        .select([
            'Id',
            'Name'
        ])
}

export async function GetStateList(countryId) {
    return await knex('StateProvince')
        .select([
            'Id',
            'Name'
        ])
        .where('CountryId', countryId)
}