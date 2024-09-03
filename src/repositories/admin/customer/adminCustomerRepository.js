import knex from "../../../config/knex.js";

export async function GetAllCustomersWithRoles(page = 1, pageSize = 25) {
    try {
        const offset = (page - 1) * pageSize;

        // First, get the filtered customer IDs
        const customerIds = await knex('Customer')
            .whereNotNull('Customer.Email')
            .select('Customer.Id')
            .limit(pageSize)
            .offset(offset);

        // Extract the IDs into an array
        const ids = customerIds.map(row => row.Id);

        // Then, get the detailed customer information for those IDs
        const result = await knex('Customer')
            .join('Customer_CustomerRole_Mapping', 'Customer.Id', 'Customer_CustomerRole_Mapping.Customer_Id')
            .join('CustomerRole', 'Customer_CustomerRole_Mapping.CustomerRole_Id', 'CustomerRole.Id')
            .leftJoin('Address', 'Customer.Email', 'Address.Email')
            .whereIn('Customer.Id', ids)
            .select(
                'Customer.Id',
                'Customer.Email',
                'Customer.CreatedOnUTC',
                'CustomerRole.Id as RoleId',
                'CustomerRole.Name as RoleName',
                'Address.FirstName',
                'Address.LastName',
                'Address.Company',
                'Address.PhoneNumber'
            )
            .groupBy(
                'Customer.Id',
                'Customer.Email',
                'Customer.CreatedOnUTC',
                'CustomerRole.Id',
                'CustomerRole.Name',
                'Address.FirstName',
                'Address.LastName',
                'Address.Company',
                'Address.PhoneNumber'
            );

        // Transform the result into the desired format
        const customers = result.reduce((acc, row) => {
            const customer = acc.find(c => c.id === row.Id);
            if (customer) {
                customer.roles.push({
                    id: row.RoleId,
                    name: row.RoleName
                });
            } else {
                acc.push({
                    id: row.Id,
                    email: row.Email,
                    createdOnUTC: row.CreatedOnUTC,
                    firstName: row.FirstName,
                    lastName: row.LastName,
                    company: row.Company,
                    phone: row.Phone,
                    roles: [{
                        id: row.RoleId,
                        name: row.RoleName
                    }]
                });
            }
            return acc;
        }, []);

        return customers;
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}