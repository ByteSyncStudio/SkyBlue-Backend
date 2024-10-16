import { SendEmail } from "../../../config/emailService.js";
import { listUnapprovedUsers, ApproveUser, GetCustomerEmail } from "../../../repositories/admin/approve/approveRepository.js";
import { getWelcomeEmailTemplate } from "../../../utils/emailTemplates.js";

export const getUnapprovedUsers = async (req, res) => {
    try {
        const users = await listUnapprovedUsers();
        res.status(200).send(
            {
                totalUsers: users ? users.length : 0,
                data: users
            }
        );
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export const approveUser = async (req, res) => {
    try {
        const customerId = req.params.id
        await ApproveUser(customerId);

        const customerEmail = await GetCustomerEmail(customerId);
        const emailTemplate = await getWelcomeEmailTemplate();
        await SendEmail(customerEmail.Email, 'Welcome to Skyblue Wholesale', emailTemplate);
        
        res.status(201).send({ message: 'User Approved' });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}