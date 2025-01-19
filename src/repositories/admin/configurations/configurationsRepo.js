import knex from "../../../config/knex.js";

export const getAllPermissionsWithRoles = async () => {
  try {
    // Fetch customer roles
    const customerRoles = await knex("CustomerRole").select(
      "Id as RoleId",
      "Name as RoleName",
      "SystemName as RoleSystemName",
      "Active as RoleActive"
    );

    // Fetch permission records
    const permissionRecords = await knex("PermissionRecord").select(
      "Id as PermissionId",
      "Name as PermissionName",
      "SystemName as PermissionSystemName",
      "Category as PermissionCategory"
    );

    // Fetch permission-role mappings
    const permissionRoleMappings = await knex(
      "PermissionRecord_Role_Mapping"
    ).select(
      "PermissionRecord_Id as PermissionId",
      "CustomerRole_Id as RoleId"
    );

    // Combine the data
    return {
      success: true,
      CustomerRoles: customerRoles,
      PermissionRecords: permissionRecords,
      PermissionRoleMappings: permissionRoleMappings,
    };
  } catch (error) {
    console.error("Error fetching access control data:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
