/**
 * Admin data model.
 *
 * Stores email addresses authorized to access admin-only routes.
 */
import mongoose from "mongoose";

/**
 * Mongoose schema for admins.
 */
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    createdByEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Admin mongoose model.
 */
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
