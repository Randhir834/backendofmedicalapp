/**
 * tpex-healthcare-backend\src\services\email.service.js
 *
 * Auto-generated documentation comments.
 */
 import { createTransporter } from "../config/mail.js";

 async function sendViaResend({ from, to, subject, text }) {
   const apiKey = process.env.RESEND_API_KEY;
   if (!apiKey) {
     const err = new Error("Email configuration missing: RESEND_API_KEY");
     err.statusCode = 500;
     throw err;
   }

   const resp = await fetch("https://api.resend.com/emails", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${apiKey}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       from,
       to: [to],
       subject,
       text,
     }),
   });

   if (!resp.ok) {
     const body = await resp.text().catch(() => "");
     const err = new Error(`Resend email failed: ${resp.status} ${resp.statusText}${body ? ` - ${body}` : ""}`);
     err.statusCode = 502;
     throw err;
   }
 }

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
   const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

   const subject = "Your TPEx Healthcare OTP";
   const text = `Your OTP is: ${otp}. It will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.`;

   if (process.env.RESEND_API_KEY) {
     await sendViaResend({ from, to, subject, text });
     return;
   }

   const transporter = createTransporter();

   await transporter.sendMail({
     from,
     to,
     subject,
     text,
   });
 }
