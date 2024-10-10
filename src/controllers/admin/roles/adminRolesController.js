import { AddRole, DeleteRole, EditRole, GetRoles } from "../../../repositories/admin/roles/adminRolesRepository.js";

export async function getRoles(req, res) {
    try {
        res.status(200).send(await GetRoles())
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function addRole(req, res) {
    try {
        const { Name, Active } = req.body;
        res.status(201).send(await AddRole(Name, Active))
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function editRole(req, res) {
    try {
        const { Name, Active } = req.body;
        res.status(201).send(await EditRole(req.params.id, Name, Active))
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}

export async function deleteRole(req, res) {
    try {
        res.status(200).send(await DeleteRole(req.params.id))
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}