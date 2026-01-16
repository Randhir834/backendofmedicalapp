/**
 * tpex-healthcare-backend\src\controllers\file.controller.js
 *
 * Auto-generated documentation comments.
 */
import { getFileInfo, openDownloadStream } from "../services/gridfs.service.js";
import Admin from "../models/admin.model.js";

// file.controller.js
//
// File download endpoint backed by GridFS.
//
// Authorization rules:
// - Admins can download any file
// - Normal users can only download their own files (metadata.userId must match)

export async function downloadFile(req, res, next) {
  try {
    // authMiddleware sets req.user.
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const requesterEmail = String(req.user?.email || "").trim().toLowerCase();
    // Admins are allowed to access any file.
    const admin = requesterEmail ? await Admin.findOne({ email: requesterEmail }).select({ _id: 1 }).lean() : null;
    const isAdmin = Boolean(admin);

    const fileId = req.params?.id;
    const info = await getFileInfo(fileId);

    if (!info) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // For non-admins, only allow downloading files owned by the current user.
    const ownerId = String(info?.metadata?.userId || "");
    if (!isAdmin && (!ownerId || ownerId !== String(userId))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.setHeader("Content-Type", info.contentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"${encodeURIComponent(info.filename || "file")}"`
    );

    // Stream file contents from GridFS to the HTTP response.
    const stream = openDownloadStream(fileId);
    stream.on("error", (err) => next(err));
    return stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}
