import knex from "../../config/knex.js";

export async function getAllEmailsByRole(roleId) {
    try {
        const query = await knex('Customer as c')
            .join('Customer_CustomerRole_Mapping as ccm', 'c.Id', 'ccm.Customer_Id')
            .join('CustomerRole as cr', 'ccm.CustomerRole_Id', 'cr.Id')
            .where('cr.Id', roleId)
            .select('c.Email')

        const emails = query.map(email => email.Email)
        return emails

    } catch (error) {
        console.error(error);
    }
}