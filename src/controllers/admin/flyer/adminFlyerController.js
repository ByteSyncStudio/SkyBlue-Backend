import { json } from "sequelize";


export async function getFlyerProducts(req, res) {
    try {
        
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}