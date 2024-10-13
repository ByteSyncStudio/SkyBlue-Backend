import { CurrentCartsTotalItems, OrderSheet, SpecificCart } from "../../../repositories/admin/sales/adminSalesRepository.js";

export async function currentCartsTotalItems(req, res) {
    try {
        const { page, size } = req.query;

        res.status(200).send(await CurrentCartsTotalItems(parseInt(page) || 1, parseInt(size) || 25))
    } catch (error) {
        console.error("Error fetching current carts: ", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function specificCart(req, res) {
    try {
        res.status(200).send(await SpecificCart(req.params.id));
    } catch (error) {
        console.error("Error fetching specific cart: ", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function orderSheet(req, res) {
    try {
        const { categoryId, tierRole, page, size } = req.query;

        res.status(200).send(await OrderSheet(categoryId, tierRole, page, size))
    } catch (error) {
        console.error("Error fetching ordersheet: ", error);
        res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Server error'
        });
    }

}