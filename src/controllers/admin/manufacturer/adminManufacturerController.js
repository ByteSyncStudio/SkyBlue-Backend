import { AddManufacturer, DeleteManufacturer, EditManufacturer, GetAllManufacturers, GetManufacturersProducts } from "../../../repositories/admin/manufacturer/adminManufacturerRepository.js";

export async function getAllManufacturers(req, res) {
    try {
        const { name } = req.query;
        const data = await GetAllManufacturers(name);
        res.status(200).send(data)
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function getManufacturersProducts(req, res) {
    try {
        res.status(200).send(await GetManufacturersProducts(req.params.id))
    } catch (error) {
        console.error("Error fetching manufacturer products:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function addManufacturer(req, res) {
    try {
        const {
            Name,
            Description,
        } = req.body;

        res.status(200).send(await AddManufacturer(Name, Description));

    } catch (error) {
        console.error("Error adding manufacturers:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function editManufacturer(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        res.status(200).send(await EditManufacturer(id, updates));
    } catch (error) {
        console.error("Error editing manufacturer:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function deleteManufacturer(req, res) {
    try {
        const { id } = req.params;
        res.status(200).send(await DeleteManufacturer(id));
    } catch (error) {
        console.error("Error editing manufacturer:", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}