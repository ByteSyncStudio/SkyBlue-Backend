import knex from "../../../config/knex.js";

export async function listUnapprovedUsers() {
    try {
        const customers = await knex('Customer')
            .select('*')
            .where({ IsApproved: false });

        const customerEmails = customers.map(({ Email }) => Email);
        const addresses = await knex('Address')
            .select('*')
            .whereIn('Email', customerEmails);

        const customerIds = customers.map(({ Id }) => Id);
        const documents = await knex('GenericAttribute')
            .select([
                'Value',
                'EntityId'
            ])
            .whereIn('EntityId', customerIds)
            .where({ KeyGroup: 'Customer' })
            .where({ Key: 'DocumentsForApproval' });

        const addressesWithDocuments = addresses.map(address => {
            const customer = customers.find(cust => cust.Email === address.Email);
            const customerDocuments = documents
                .filter(doc => doc.EntityId === customer.Id)
                .map(doc => `https://skybluewholesale.com/content/images/ForApproval/${doc.Value}`);
            return {
                ...address,
                Id: customer.Id,
                Documents: customerDocuments
            };
        });

        return addressesWithDocuments;
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error fetching unapproved users.';
        throw error;
    }
}

export async function ApproveUser(customerId) {
    try {
        return await knex('Customer')
            .update({
                IsApproved: true,
                active: true
            })
            .where({ Id: customerId });
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error approving user.'
        throw error;
    }
}

export async function GetCustomerEmail(customerId) {
    try {
        return await knex('Customer')
            .select('Email')
            .where('Id', customerId)
            .first()
    } catch (error) {
        console.error(error);
        error.statusCode = 500;
        error.message = 'Error getting email.'
        throw error;
    }
}