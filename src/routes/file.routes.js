/**
 * tpex-healthcare-backend\src\routes\file.routes.js
 *
 * Auto-generated documentation comments.
 */
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { downloadFile } from "../controllers/file.controller.js";

// file.routes.js
//
// File download routes.
// Files are protected by authMiddleware so only authenticated users can
// access uploaded documents.
const router = Router();

router.get("/:id", authMiddleware, downloadFile);

export default router;
