import { listUnapprovedUsers, ApproveUser } from "../../../repositories/admin/approve/approveRepository.js";

export const getUnapprovedUsers = async (req, res) => {
    try {
        const users = await listUnapprovedUsers();
        const documents = 1
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
        res.status(201).send({ message: 'User Approved' });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}