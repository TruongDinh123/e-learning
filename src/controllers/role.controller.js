"use strict";

const { SuccessReponse, Created } = require("../core/success.reponse");
const { RoleService } = require("../services/role.service");

class RoleController {
  CreateRole = async (req, res, next) => {
    new Created({
      message: "Role Created!",
      metadata: await RoleService.createRole(req.body),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  getRoles = async (req, res, next) => {
    new SuccessReponse({
      message: "Get All Role Success",
      metadata: await RoleService.getAllRole(),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  updateRole = async (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    return res.status(200).json(await RoleService.updateRole({ id, name }));
  };

  deleteRole = async (req, res, next) => {
    const { id } = req.params;
    try {
      const delrole = await RoleService.deleteRole({ id });

      return res.status(200).json({
        status: true,
        message: "Role Deleted!",
      });
    } catch (error) {
      throw new Error(error);
    }
  };
}

module.exports = new RoleController();
