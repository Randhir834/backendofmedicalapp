/**
 * tpex-healthcare-backend\src\controllers\user.controller.js
 *
 * Auto-generated documentation comments.
 */
import User from "../models/user.model.js";
import { deleteFile, uploadBuffer } from "../services/gridfs.service.js";

// user.controller.js
//
// User endpoints for the currently logged-in user.
// - getMyUser: returns basic user info (email + profilePhoto metadata)
// - updateMyProfilePhoto: uploads a new profile photo to GridFS and updates User.profilePhoto

function isAllowedProfilePhotoUpload(file) {
  const mimetype = String(file?.mimetype || "").toLowerCase();
  if (mimetype.startsWith("image/")) return true;

  if (mimetype === "application/octet-stream") {
    const name = String(file?.originalname || "").toLowerCase();
    if (
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * getMyUser.
 */
/**
 * getMyUser.
 */
/**
 * getMyUser.
 */
export async function getMyUser(req, res, next) {
  try {
    // req.user is set by authMiddleware.
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        profilePhoto: user.profilePhoto?.fileId
          ? {
              fileId: user.profilePhoto.fileId.toString(),
              filename: user.profilePhoto.filename,
              contentType: user.profilePhoto.contentType,
              size: user.profilePhoto.size,
            }
          : null,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * updateMyProfilePhoto.
 */
/**
 * updateMyProfilePhoto.
 */
/**
 * updateMyProfilePhoto.
 */
export async function updateMyProfilePhoto(req, res, next) {
  let newFileId = null;

  try {
    // Upload new profile photo and replace old one.
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Profile photo is required" });
    }

    if (!isAllowedProfilePhotoUpload(file)) {
      return res.status(400).json({ success: false, message: "Unsupported file type" });
    }

    const filename = String(file.originalname || "profile-photo").trim() || "profile-photo";

    // Store in GridFS.
    newFileId = await uploadBuffer({
      buffer: file.buffer,
      filename,
      contentType: file.mimetype,
      metadata: { userId: String(userId), field: "profilePhoto" },
    });

    const oldFileId = user.profilePhoto?.fileId;

    user.profilePhoto = {
      fileId: newFileId,
      filename,
      contentType: file.mimetype,
      size: file.size,
    };

    await user.save();

    // Best-effort cleanup of old file.
    if (oldFileId) {
      await Promise.allSettled([deleteFile(oldFileId)]);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        profilePhoto: {
          fileId: user.profilePhoto.fileId.toString(),
          filename: user.profilePhoto.filename,
          contentType: user.profilePhoto.contentType,
          size: user.profilePhoto.size,
        },
      },
    });
  } catch (err) {
    // If something failed after upload, remove the new file to avoid orphan files.
    if (newFileId) {
      await Promise.allSettled([deleteFile(newFileId)]);
    }
    return next(err);
  }
}
