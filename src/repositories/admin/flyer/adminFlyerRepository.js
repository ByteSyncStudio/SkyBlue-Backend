import knex from "../../../config/knex.js";


export async function GetFlyerProducts() {
    try {
        
    } catch (error) {
        console.error('Error Fetching Flyers:', error);
        throw {
            statusCode: 500,
            message: 'Error Fetching Flyers.'
        };
    }
}