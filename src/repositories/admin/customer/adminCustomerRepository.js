import knex from "../../../config/knex.js";

export async function GetAllCustomersWithRoles(page = 1, pageSize = 25, email = '', firstName = '', lastName = '', phoneNumber = '') {
    try {
        const offset = (page - 1) * pageSize;

        // Subquery to get the latest address for each customer
        const latestAddressSubquery = knex('Address')
            .select('Email')
            .max('Id as LatestAddressId')
            .groupBy('Email')
            .as('LatestAddress');

        // Main query to get customers with their latest address
        let customerQuery = knex('Customer')
            .join(latestAddressSubquery, 'Customer.Email', 'LatestAddress.Email')
            .join('Address', function() {
                this.on('Address.Email', '=', 'Customer.Email')
                    .andOn('Address.Id', '=', 'LatestAddress.LatestAddressId');
            })
            .whereNotNull('Customer.Email');

        if (email) {
            customerQuery = customerQuery.andWhere('Customer.Email', 'like', `%${email}%`);
        }
        if (firstName) {
            customerQuery = customerQuery.andWhere('Address.FirstName', 'like', `%${firstName}%`);
        }
        if (lastName) {
            customerQuery = customerQuery.andWhere('Address.LastName', 'like', `%${lastName}%`);
        }
        if (phoneNumber) {
            customerQuery = customerQuery.andWhere('Address.PhoneNumber', 'like', `%${phoneNumber}%`);
        }

        const customers = await customerQuery
            .select(
                'Customer.Id',
                'Customer.Email',
                'Customer.Active',
                'Customer.CreatedOnUTC',
                'Address.FirstName',
                'Address.LastName',
                'Address.Company',
                'Address.PhoneNumber'
            )
            .orderBy('Customer.CreatedOnUTC', 'desc')
            .offset(offset)
            .limit(pageSize);

        // Now get the roles for these customers
        const customerIds = customers.map(c => c.Id);
        const roles = await knex('Customer_CustomerRole_Mapping')
            .join('CustomerRole', 'Customer_CustomerRole_Mapping.CustomerRole_Id', 'CustomerRole.Id')
            .whereIn('Customer_CustomerRole_Mapping.Customer_Id', customerIds)
            .select(
                'Customer_CustomerRole_Mapping.Customer_Id',
                'CustomerRole.Id as RoleId',
                'CustomerRole.Name as RoleName'
            );

        // Merge roles into customers
        const customersWithRoles = customers.map(customer => ({
            id: customer.Id,
            email: customer.Email,
            createdOnUTC: customer.CreatedOnUTC,
            firstName: customer.FirstName,
            lastName: customer.LastName,
            company: customer.Company,
            phone: customer.PhoneNumber,
            active: customer.Active,
            roles: roles
                .filter(role => role.Customer_Id === customer.Id)
                .map(role => ({
                    id: role.RoleId,
                    name: role.RoleName
                }))
        }));

        return customersWithRoles;
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function UpdateCustomerRolesAndStatus(customerId, rolesToAdd, rolesToRemove, active) {
    const trx = await knex.transaction();

    try {
        // Update customer's active status if provided
        if (active !== undefined) {
            await trx('Customer')
                .where('Id', customerId)
                .update({ Active: active });
        }

        // Add new roles
        if (rolesToAdd && rolesToAdd.length > 0) {
            // First, get existing roles for the customer
            const existingRoles = await trx('Customer_CustomerRole_Mapping')
                .where('Customer_Id', customerId)
                .select('CustomerRole_Id');

            const existingRoleIds = existingRoles.map(role => role.CustomerRole_Id);

            // Filter out roles that already exist
            const newRoles = rolesToAdd.filter(roleId => !existingRoleIds.includes(roleId));

            // Insert new roles
            if (newRoles.length > 0) {
                const rolesToInsert = newRoles.map(roleId => ({
                    Customer_Id: customerId,
                    CustomerRole_Id: roleId
                }));

                await trx('Customer_CustomerRole_Mapping').insert(rolesToInsert);
            }
        }

        // Remove roles
        if (rolesToRemove && rolesToRemove.length > 0) {
            await trx('Customer_CustomerRole_Mapping')
                .where('Customer_Id', customerId)
                .whereIn('CustomerRole_Id', rolesToRemove)
                .delete();
        }

        await trx.commit();

        return {
            success: true,
            message: "Customer updated successfully"
        };
    } catch (error) {
        await trx.rollback();
        console.error(error);
        throw error;
    }
}

export async function GetCustomerRoles() {
    try {
        return await knex('CustomerRole')
        .select([
            'Id',
            'Name'
        ])
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error getting roles.';
        throw error;
    }
}