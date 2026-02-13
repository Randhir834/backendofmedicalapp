/**
 * tpex-healthcare-backend\src\services\email.service.js
 *
 * Auto-generated documentation comments.
 */
import { createTransporter } from "../config/mail.js";

async function sendViaResend({ from, to, subject, text, html }) {
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
      ...(html ? { html } : {}),
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    const err = new Error(`Resend email failed: ${resp.status} ${resp.statusText}${body ? ` - ${body}` : ""}`);
    err.statusCode = 502;
    throw err;
  }
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ from, to, subject, text, html });
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

/**
 * sendOtpEmail.
 */
export async function sendOtpEmail({ to, otp }) {
  const subject = "Your TPEx Healthcare OTP";
  const text = `Your OTP is: ${otp}. It will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.`;
  await sendEmail({ to, subject, text });
}

export async function sendAppointmentConfirmationEmail({
  to,
  patientName,
  doctorName,
  dateTime,
  timeSlot,
  consultationType,
  location,
  fee,
  appointmentId,
}) {
  const subject = "Appointment Confirmation - TPEx Healthcare";

  const whenText = dateTime
    ? `${new Date(dateTime).toLocaleString()}${timeSlot ? ` (${timeSlot})` : ""}`
    : `${timeSlot || ""}`.trim();
  const locationText = String(location || "").trim() || (consultationType === "in_clinic" ? "Clinic" : "Online");
  const consultText = String(consultationType || "").trim() || "in_clinic";
  const feeText = Number.isFinite(Number(fee)) ? String(Number(fee)) : "";

  const text =
    `Hello ${patientName || "Patient"},\n\n` +
    `Your appointment has been successfully booked.\n\n` +
    `Appointment Details:\n` +
    `- Appointment ID: ${appointmentId || ""}\n` +
    `- Doctor: ${doctorName || ""}\n` +
    `- Date/Time: ${whenText}\n` +
    `- Consultation Type: ${consultText}\n` +
    `- Location: ${locationText}\n` +
    (feeText ? `- Fee: ${feeText}\n` : "") +
    `\nThank you,\nTPEx Healthcare`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hello ${patientName || "Patient"},</p>
      <p>Your appointment has been successfully booked.</p>
      <h3 style="margin: 16px 0 8px;">Appointment Details</h3>
      <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr><td><strong>Appointment ID</strong></td><td>${appointmentId || ""}</td></tr>
        <tr><td><strong>Doctor</strong></td><td>${doctorName || ""}</td></tr>
        <tr><td><strong>Date/Time</strong></td><td>${whenText}</td></tr>
        <tr><td><strong>Consultation Type</strong></td><td>${consultText}</td></tr>
        <tr><td><strong>Location</strong></td><td>${locationText}</td></tr>
        ${feeText ? `<tr><td><strong>Fee</strong></td><td>${feeText}</td></tr>` : ""}
      </table>
      <p style="margin-top: 16px;">Thank you,<br/>TPEx Healthcare</p>
    </div>
  `.trim();

  await sendEmail({ to, subject, text, html });
}

export async function sendAppointmentReminderEmail({
  to,
  patientName,
  doctorName,
  dateTime,
  timeSlot,
  consultationType,
  location,
  fee,
  appointmentId,
}) {
  const subject = "Appointment Reminder - TPEx Healthcare";

  const whenText = dateTime
    ? `${new Date(dateTime).toLocaleString()}${timeSlot ? ` (${timeSlot})` : ""}`
    : `${timeSlot || ""}`.trim();
  const locationText = String(location || "").trim() || (consultationType === "in_clinic" ? "Clinic" : "Online");
  const consultText = String(consultationType || "").trim() || "in_clinic";
  const feeText = Number.isFinite(Number(fee)) ? String(Number(fee)) : "";

  const text =
    `Hello ${patientName || "Patient"},\n\n` +
    `This is a reminder for your upcoming appointment. Please do not miss your booking.\n\n` +
    `Appointment Details:\n` +
    `- Appointment ID: ${appointmentId || ""}\n` +
    `- Doctor: ${doctorName || ""}\n` +
    `- Date/Time: ${whenText}\n` +
    `- Consultation Type: ${consultText}\n` +
    `- Location: ${locationText}\n` +
    (feeText ? `- Fee: ${feeText}\n` : "") +
    `\nThank you,\nTPEx Healthcare`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hello ${patientName || "Patient"},</p>
      <p>This is a reminder for your upcoming appointment. <strong>Please do not miss your booking.</strong></p>
      <h3 style="margin: 16px 0 8px;">Appointment Details</h3>
      <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr><td><strong>Appointment ID</strong></td><td>${appointmentId || ""}</td></tr>
        <tr><td><strong>Doctor</strong></td><td>${doctorName || ""}</td></tr>
        <tr><td><strong>Date/Time</strong></td><td>${whenText}</td></tr>
        <tr><td><strong>Consultation Type</strong></td><td>${consultText}</td></tr>
        <tr><td><strong>Location</strong></td><td>${locationText}</td></tr>
        ${feeText ? `<tr><td><strong>Fee</strong></td><td>${feeText}</td></tr>` : ""}
      </table>
      <p style="margin-top: 16px;">Thank you,<br/>TPEx Healthcare</p>
    </div>
  `.trim();

  await sendEmail({ to, subject, text, html });
}

export async function sendAppointmentRescheduledEmail({
  to,
  patientName,
  doctorName,
  dateTime,
  timeSlot,
  consultationType,
  location,
  fee,
  appointmentId,
}) {
  const subject = "Appointment Rescheduled - TPEx Healthcare";

  const whenText = dateTime
    ? `${new Date(dateTime).toLocaleString()}${timeSlot ? ` (${timeSlot})` : ""}`
    : `${timeSlot || ""}`.trim();
  const locationText = String(location || "").trim() || (consultationType === "in_clinic" ? "Clinic" : "Online");
  const consultText = String(consultationType || "").trim() || "in_clinic";
  const feeText = Number.isFinite(Number(fee)) ? String(Number(fee)) : "";

  const text =
    `Hello ${patientName || "Patient"},\n\n` +
    `Your appointment has been successfully rescheduled.\n\n` +
    `Updated Appointment Details:\n` +
    `- Appointment ID: ${appointmentId || ""}\n` +
    `- Doctor: ${doctorName || ""}\n` +
    `- New Date/Time: ${whenText}\n` +
    `- Consultation Type: ${consultText}\n` +
    `- Location: ${locationText}\n` +
    (feeText ? `- Fee: ${feeText}\n` : "") +
    `\nThank you,\nTPEx Healthcare`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hello ${patientName || "Patient"},</p>
      <p>Your appointment has been successfully rescheduled.</p>
      <h3 style="margin: 16px 0 8px;">Updated Appointment Details</h3>
      <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr><td><strong>Appointment ID</strong></td><td>${appointmentId || ""}</td></tr>
        <tr><td><strong>Doctor</strong></td><td>${doctorName || ""}</td></tr>
        <tr><td><strong>New Date/Time</strong></td><td>${whenText}</td></tr>
        <tr><td><strong>Consultation Type</strong></td><td>${consultText}</td></tr>
        <tr><td><strong>Location</strong></td><td>${locationText}</td></tr>
        ${feeText ? `<tr><td><strong>Fee</strong></td><td>${feeText}</td></tr>` : ""}
      </table>
      <p style="margin-top: 16px;">Thank you,<br/>TPEx Healthcare</p>
    </div>
  `.trim();

  await sendEmail({ to, subject, text, html });
}
