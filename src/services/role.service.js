const { NotFoundError } = require("../core/error.response");
const Role = require("../models/role.model");
const User = require("../models/user.model");

class RoleService {
  static createRole = async ({ name }) => {
    const existingRole = await Role.findOne({ name });

    if (existingRole) throw new Error("Role already exists");

    const newRole = await Role.create({ name });
    await newRole.save();

    return newRole;
  };

  static getAllRole = async () => {
    const roles = await Role.find().where({ isActive: true });
    return roles;
  };

  static updateRole = async ({ id, name }) => {
    const role = await Role.findById(id);

    if (!role) throw new Error("Role not found");

    const existingRole = await Role.findOne({ name, isActive: true });

    if (existingRole) throw new Error("Role already exists");

    role.name = name;

    const updateRole = await role.save();

    return updateRole;
  };

  static findById = async ({
    roleId,
    select = {
      roleId: 1,
      name: 1,
    },
  }) => {
    return await User.findOne({ roleId }).select(select).lean();
  };

  static deleteRole = async ({ id }) => {
    const role = await Role.findById(id);
    if (!role) throw new Error("Role not found");
  
    const usersWithRole = await User.find({ roles: role.name });
    if (usersWithRole.length > 0) {
      throw new Error("Cannot delete role as it is assigned to users");
    }
  
    role.isActive = false;
  
    await role.save();
    return role;
  };
}

module.exports = {
  RoleService,
};
