/**
 * tpex-healthcare-backend\src\services\email.service.js
 *
 * Auto-generated documentation comments.
 */
 import { createTransporter } from "../config/mail.js";

 /**
  * sendOtpEmail.
  */
 /**
  * sendOtpEmail.
  */
 /**
  * sendOtpEmail.
  */
 export async function sendOtpEmail({ to, otp }) {
   const transporter = createTransporter();
   const from = process.env.EMAIL_USER;

   const subject = "Your TPEx Healthcare OTP";
   const text = `Your OTP is: ${otp}. It will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.`;

   await transporter.sendMail({
     from,
     to,
     subject,
     text,
   });
 }
