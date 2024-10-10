import knex from "../../../config/knex.js";

export async function GetRoles() {
    try {
        return await knex('CustomerRole')
            .select('*')

    } catch (error) {
        console.error('Error in fetching roles: ', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function AddRole(name, isActive) {
    const trx = await knex.transaction();

    try {
        await trx('CustomerRole').insert({
            Name: name,
            Active: isActive,
            TaxExempt: 0,
            FreeShipping: 0,
            IsSystemRole: 0,
            EnablePasswordLifetime: 0,
            PurchasedWithProductId: 0
        })

        await trx.commit();

        return {
            success: true,
            message: "Role added successfully"
        }

    } catch (error) {
        await trx.rollback();
        console.error('Error in adiing roles: ', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function EditRole(id, name, isActive) {
    const trx = await knex.transaction();

    try {
        const updateData = {};
        if (name !== undefined) updateData.Name = name;
        if (isActive !== undefined) updateData.Active = isActive;

        if (Object.keys(updateData).length > 0) {
            await trx('CustomerRole')
                .where({ Id: id })
                .update(updateData);
        }

        await trx.commit();

        return {
            success: true,
            message: "Role updated successfully"
        }

    } catch (error) {
        await trx.rollback();
        console.error('Error in updating roles: ', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }
}

export async function DeleteRole(id) {
    const trx = await knex.transaction();

    try {
        await trx('CustomerRole')
            .where({ Id: id })
            .del()

        await trx.commit();

        return {
            success: true,
            message: "Role deleted successfully"
        }

    } catch (error) {
        await trx.rollback();
        console.error('Error in deleting roles: ', error);
        error.statusCode = 500;
        error.message = 'Error getting users.';
        throw error;
    }

}