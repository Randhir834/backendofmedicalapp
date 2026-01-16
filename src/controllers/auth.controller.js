/**
 * tpex-healthcare-backend\src\controllers\auth.controller.js
 *
 * Auto-generated documentation comments.
 */
import User from "../models/user.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Admin from "../models/admin.model.js";
import OtpSession from "../models/otpSession.model.js";
import { generateOtp, hashOtp } from "../utils/otp.util.js";
import { sendOtpEmail } from "../services/email.service.js";
import { signAccessToken } from "../config/jwt.js";

// Normalize email to lowercase
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Validate email format
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * requestOtp (UPDATED)
 * ✔ Respond instantly
 * ✔ Send OTP email in background
 * ✔ Prevent timeout issues
 */
export async function requestOtp(req, res, next) {
  try {
    // Accept email from body and normalize it.
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    // Generate OTP and store only a hash in DB.
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const expireMinutes = Number.parseInt(process.env.OTP_EXPIRE_MINUTES || "5", 10);
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    // Create or update OtpSession with OTP hash and expiration.
    await OtpSession.findOneAndUpdate(
      { email, verifiedAt: null },
      { $set: { otpHash, expiresAt, verifiedAt: null } },
      { upsert: true, new: true }
    );

    // ⭐ IMMEDIATE RESPONSE (fixes timeout)
    res.status(200).json({
      success: true,
      message: "OTP is being sent",
      email,
    });

    // ⭐ SEND EMAIL IN BACKGROUND (no waiting)
    sendOtpEmail({ to: email, otp }).catch(err => {
      console.error("Failed to send OTP email:", err.message);
    });

  } catch (err) {
    return next(err);
  }
}

/**
 * verifyOtp
 */
export async function verifyOtp(req, res, next) {
  try {
    // Validate the email + OTP format.
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    if (!/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Valid 6-digit OTP is required" });
    }

    // Find the latest unverified OTP session.
    const session = await OtpSession.findOne({ email, verifiedAt: null }).sort({ createdAt: -1 });
    if (!session) {
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new one." });
    }
    if (session.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    // Compare hashed OTP.
    const providedHash = hashOtp(otp);
    if (providedHash !== session.otpHash) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    session.verifiedAt = new Date();
    await session.save();

    // Ensure User record exists
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { lastLoginAt: new Date() } },
      { upsert: true, new: true }
    );

    // Bootstrap the admin account if needed
    const bootstrapAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "randhircool44@gmail.com");
    if (bootstrapAdminEmail) {
      await Admin.findOneAndUpdate(
        { email: bootstrapAdminEmail },
        { $setOnInsert: { email: bootstrapAdminEmail, createdByEmail: bootstrapAdminEmail } },
        { upsert: true, new: true }
      );
    }

    const [patient, doctor] = await Promise.all([
      Patient.findOne({ email }).select({ _id: 1 }).lean(),
      Doctor.findOne({ email }).select({ _id: 1 }).lean(),
    ]);

    const admin = await Admin.findOne({ email }).select({ _id: 1 }).lean();
    const isAdmin = Boolean(admin);

    // Determine role
    const role = isAdmin ? "admin" : patient ? "patient" : doctor ? "doctor" : null;
    const isRegistered = Boolean(role);

    // Generate access token
    const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });

    return res.status(200).json({
      success: true,
      accessToken,
      isRegistered,
      role,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (err) {
    return next(err);
  }
}
