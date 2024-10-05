import { now } from "sequelize/lib/utils";
import knex from "../../../config/knex.js";

export async function GetAllManufacturers() {
    try {
        return await knex('Manufacturer').select('*')
    } catch (error) {
        console.error('Error in fetching manufacturers', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function AddManufacturer(name, description) {
    const trx = await knex.transaction();

    try {
        await trx('Manufacturer').insert({
            Name: name,
            Description: description,
            ManufacturerTemplateId: 1,
            PictureId: 0,
            PageSize: 6,
            AllowCustomersToSelectPageSize: 1,
            PageSizeOptions: '6, 3, 9',
            SubjectToAcl: 0,
            LimitedToStores: 0,
            Published: 1,
            Deleted: 0,
            DisplayOrder: 0,
            CreatedOnUTC: new Date().toISOString(),
            UpdatedOnUTC: new Date().toISOString()
        });

        await trx.commit();

        return {
            success: true,
            message: "Manufacturer added successfully"
        };

    } catch (error) {
        await trx.rollback();
        console.error('Error in adding manufacturers', error);
        error.statusCode = 500;
        error.message = 'Error adding manufacturer.';
        throw error;
    }
}

export async function EditManufacturer(id, updates) {
    const trx = await knex.transaction();

    try {
        const updateData = {
            ...updates,
            UpdatedOnUTC: new Date().toISOString()
        };

        await trx('Manufacturer')
            .where({ id })
            .update(updateData);

        await trx.commit();

        return {
            success: true,
            message: "Manufacturer updated successfully"
        };

    } catch (error) {
        await trx.rollback();
        console.error('Error in editing manufacturer', error);
        error.statusCode = 500;
        error.message = 'Error editing manufacturer.';
        throw error;
    }
}

export async function DeleteManufacturer(id) {
    const trx = await knex.transaction();

    try {
        await trx('Manufacturer')
            .where({ id })
            .update('Deleted', true)

        await trx.commit();

        return {
            success: true,
            message: "Manufacturer deleted successfully"
        }
        
    } catch (error) {
        await trx.rollback();
        console.error('Error in editing manufacturer', error);
        error.statusCode = 500;
        error.message = 'Error editing manufacturer.';
        throw error;
    }
}