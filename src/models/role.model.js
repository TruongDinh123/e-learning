"use strict";
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Admin-Super', 'Admin', 'Mentor', 'Trainee'],
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  }
}, {
    timestamps: true,
});

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;