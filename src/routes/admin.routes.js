/**
 * tpex-healthcare-backend\src\routes\admin.routes.js
 *
 * Auto-generated documentation comments.
 */
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import { doctorRegistrationUpload } from "../middlewares/upload.middleware.js";
import {
  adminGetDoctorAppointments,
  adminListAppointmentDoctors,
} from "../controllers/appointment.controller.js";
import {
  approveDoctor,
  getDoctorProfilePhotoForAdmin,
  getDoctorForApproval,
  getPatientDetails,
  getPatientProfilePhotoForAdmin,
  listPendingDoctors,
  listPatients,
  registerDoctorByAdmin,
  listVerifiedDoctors,
} from "../controllers/admin.controller.js";
import { addAdmin } from "../controllers/adminManagement.controller.js";

// admin.routes.js
//
// Admin-only routes.
//
// These endpoints require:
// - authMiddleware: user must be logged in
// - adminMiddleware: user must have admin privileges
//
// Features covered:
// - Doctor approval workflow (pending list, details, approve)
// - Patient listing/details (for admin viewing)
// - Admin view of doctor appointments
// - Admin creation (addAdmin)

const router = Router();

// Doctor approval workflow
router.get("/doctors/pending", authMiddleware, adminMiddleware, listPendingDoctors);
router.get("/doctors/verified", authMiddleware, adminMiddleware, listVerifiedDoctors);
router.post("/doctors/register", authMiddleware, adminMiddleware, doctorRegistrationUpload, registerDoctorByAdmin);
router.get("/doctors/:id/profile-photo", authMiddleware, adminMiddleware, getDoctorProfilePhotoForAdmin);
router.get("/doctors/:id", authMiddleware, adminMiddleware, getDoctorForApproval);
router.put("/doctors/:id/approve", authMiddleware, adminMiddleware, approveDoctor);

router.get("/patients", authMiddleware, adminMiddleware, listPatients);
router.get("/patients/:id/profile-photo", authMiddleware, adminMiddleware, getPatientProfilePhotoForAdmin);
router.get("/patients/:id", authMiddleware, adminMiddleware, getPatientDetails);

router.get("/appointments/doctors", authMiddleware, adminMiddleware, adminListAppointmentDoctors);
router.get(
  "/appointments/doctors/:doctorId",
  authMiddleware,
  adminMiddleware,
  adminGetDoctorAppointments
);

router.post("/admins", authMiddleware, adminMiddleware, addAdmin);

export default router;
