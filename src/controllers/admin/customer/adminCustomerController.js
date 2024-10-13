import { EditCustomerActive, EditCustomerDetails, GetAllCustomersWithRoles, GetCustomerByOrderTotal, GetCustomerRoles, GetSingleCustomer, UpdateCustomerRoles } from "../../../repositories/admin/customer/adminCustomerRepository.js";

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

// export async function updateCustomerRolesAndStatus(req, res) {
//     try {
//         const id = req.params.id;
//         const { roles, removeRoles, active } = req.body;

//         const result = await UpdateCustomerRolesAndStatus(id, roles, removeRoles, active);

//         if (result.success) {
//             res.status(200).json(result);
//         } else {
//             res.status(404).json(result);
//         }
//     } catch (error) {
//         console.error("Error updating customer:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Server error'
//         });
//     }
// }

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

export async function getCustomerByOrderTotal(req, res) {
    try {
        //? Sorting
        const sortBy = req.query.sortBy || 'order_total';
        const validSortOptions = ['order_total', 'order_count'];
        if (!validSortOptions.includes(sortBy)) {
            return res.status(400).json({ message: 'Invalid sort options. Valid sort options are: ' + validSortOptions.join(', ') });
        }

        //? Time
        const startDate = req.query.start ? new Date(req.query.start) : null;
        const endDate = req.query.end ? new Date(req.query.end) : null;
        if (startDate && isNaN(startDate) || endDate && isNaN(endDate)) {
            return res.status(400).json({ message: 'Invalid date format.' });
        }


        const result = await GetCustomerByOrderTotal(sortBy, startDate, endDate, parseInt(req.query.page) || 1, parseInt(req.query.size) || 25);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function getSingleCustomer(req, res) {
    try {
        res.status(200).send(await GetSingleCustomer(req.params.id));
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function editCustomer(req, res) {
    try {
        const customerId = req.params.id;
        const {
            FirstName,
            LastName,
            Company,
            Address1,
            Address2,
            ZipPostalCode,
            City,
            CountryId,
            StateProvinceId,
            PhoneNumber,
            Active,
            roles,
            removeRoles
        } = req.body;

        //? Handle Customer 'Active'
        if (Active !== undefined) {
            await EditCustomerActive(customerId, Active);
        }

        //? Handle Customer Roles
        if (roles !== undefined || removeRoles !== undefined) {
            await UpdateCustomerRoles(customerId, roles, removeRoles);
        }

        //? Handle Customer details (Address Table)
        const updateFields = {
            FirstName,
            LastName,
            Company,
            Address1,
            Address2,
            ZipPostalCode,
            City,
            CountryId,
            StateProvinceId,
            PhoneNumber
        };

        // Remove undefined fields
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        if (updateFields.length !== 0) {
            const result = await EditCustomerDetails(customerId, updateFields);
            res.status(200).json(result);
        } else {
            res.status(200).json({ success: true, message: "No fields to update" });
        }
    } catch (error) {
        console.error('Error in editCustomer:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}
