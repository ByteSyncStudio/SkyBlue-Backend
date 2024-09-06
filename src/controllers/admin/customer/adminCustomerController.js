import { GetAllCustomersWithRoles, GetCustomerRoles, UpdateCustomerRolesAndStatus } from "../../../repositories/admin/customer/adminCustomerRepository.js";

export async function getAllCustomersWithRoles(req, res) {
    try {
        const { page = 1, size = 25, email = '', firstName = '', lastName = '', phoneNumber = '' } = req.query;
        const customers = await GetAllCustomersWithRoles(page, size, email, firstName, lastName, phoneNumber);
        res.status(200).json(customers);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function updateCustomerRolesAndStatus(req, res) {
    try {
        const id = req.params.id;
        const { roles, removeRoles, active } = req.body;

        const result = await UpdateCustomerRolesAndStatus(id, roles, removeRoles, active);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}
export async function getCustomerRoles(req, res) {
    try {
        const result = await GetCustomerRoles();
        res.status(200).send(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}