import { GetUserInfo, ChangePassword, UpdateUserInfo } from '../repositories/customerRepository.js'


export async function getCustomerInfo(req, res) {
    try {
        const result = await GetUserInfo(req.user);
        res.status(200).send(result)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'currentPassword and newPassword fields are required' });
            return;
        }

        const result = await ChangePassword(req.user, currentPassword, newPassword);
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function updateCustomerInfo(req, res) {
    try {
        const result = await UpdateUserInfo(req.user, req.body)
        res.status(result.statusCode || 200).json(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}