"use strict";

const packageModel = require("../models/package.model");

class PackageService {
  static createPackage = async ({ name, maxTeachers, price }) => {
    const newPackage = await packageModel.create({
      name,
      maxTeachers,
      price,
    });

    await newPackage.save();

    return newPackage;
  };

  static getAllPackages = async () => {
    const packages = await Package.find();
    return packages;
  };
}

module.exports = PackageService;
