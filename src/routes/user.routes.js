/**
 * tpex-healthcare-backend\src\routes\user.routes.js
 *
 * Auto-generated documentation comments.
 */
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { profilePhotoUpload } from "../middlewares/upload.middleware.js";
import { getMyUser, updateMyProfilePhoto } from "../controllers/user.controller.js";

// user.routes.js
//
// User routes for the currently logged-in account.
// - GET /users/me -> return user info (id/email/role)
// - PUT /users/me/profile-photo -> upload/update profile photo
const router = Router();

router.get("/me", authMiddleware, getMyUser);
router.put("/me/profile-photo", authMiddleware, profilePhotoUpload, updateMyProfilePhoto);

export default router;
