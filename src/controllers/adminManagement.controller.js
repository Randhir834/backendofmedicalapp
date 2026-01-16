/**
 * tpex-healthcare-backend\src\controllers\adminManagement.controller.js
 *
 * Auto-generated documentation comments.
 */
import Admin from "../models/admin.model.js";

/**
 * normalizeEmail.
 */
/**
 * normalizeEmail.
 */
/**
 * normalizeEmail.
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * isValidEmail.
 */
/**
 * isValidEmail.
 */
/**
 * isValidEmail.
 */
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * addAdmin.
 */
/**
 * addAdmin.
 */
/**
 * addAdmin.
 */
export async function addAdmin(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    const requesterEmail = normalizeEmail(req.user?.email);

    const admin = await Admin.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, createdByEmail: requesterEmail || null } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        createdByEmail: admin.createdByEmail,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    return next(err);
  }
}
