/**
 * tpex-healthcare-backend\src\config\mail.js
 *
 * Auto-generated documentation comments.
 */
 import nodemailer from "nodemailer";

 /**
  * createTransporter.
  */
 /**
  * createTransporter.
  */
 /**
  * createTransporter.
  */
 export function createTransporter() {
   const service = process.env.EMAIL_SERVICE;
   const user = process.env.EMAIL_USER;
   const pass = process.env.EMAIL_PASS;

   if (!service || !user || !pass) {
     const err = new Error("Email configuration missing: EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS");
     err.statusCode = 500;
     throw err;
   }

   return nodemailer.createTransport({
     service,
     auth: {
       user,
       pass,
     },
   });
 }
