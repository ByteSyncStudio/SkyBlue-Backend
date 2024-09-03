import { GetAllCustomersWithRoles } from "../../../repositories/admin/customer/adminCustomerRepository.js";

export async function getAllCustomersWithRoles(req, res) {
    try {
        const { page = 1, size = 25, email = '', firstName = '', phone = '' } = req.query;
        const customers = await GetAllCustomersWithRoles(page, size, email, firstName, phone);
        res.status(200).json(customers);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Server error'
      });
    }
    
}