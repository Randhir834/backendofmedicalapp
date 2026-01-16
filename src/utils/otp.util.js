/**
 * tpex-healthcare-backend\src\utils\otp.util.js
 *
 * Auto-generated documentation comments.
 */
 import crypto from "crypto";

 /**
  * generateOtp.
  */
 /**
  * generateOtp.
  */
 /**
  * generateOtp.
  */
 export function generateOtp() {
   const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
   return otp;
 }

 /**
  * hashOtp.
  */
 /**
  * hashOtp.
  */
 /**
  * hashOtp.
  */
 export function hashOtp(otp) {
   const salt = process.env.JWT_SECRET || "otp_salt";
   return crypto.createHash("sha256").update(`${otp}.${salt}`).digest("hex");
 }
