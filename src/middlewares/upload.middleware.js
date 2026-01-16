/**
 * tpex-healthcare-backend\src\middlewares\upload.middleware.js
 *
 * Auto-generated documentation comments.
 */
import multer from "multer";

// upload.middleware.js
//
// Centralized multipart upload configuration.
//
// Notes:
// - Uses multer.memoryStorage() so files are available as in-memory buffers
//   (req.file / req.files) for uploading to GridFS.
// - fileFilter restricts uploads to PDFs and images.
// - limits.fileSize enforces a max upload size.
const MAX_FILE_SIZE_BYTES = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || "26214400", 10); // 25MB

// In-memory storage for uploaded files
const storage = multer.memoryStorage();

// Filter function to restrict file types to PDFs and images
function fileFilter(req, file, cb) {
  const mimetype = String(file?.mimetype || "").toLowerCase();

  const allowed =
    mimetype === "application/pdf" ||
    mimetype === "application/x-pdf" ||
    mimetype.startsWith("image/") ||
    mimetype === "application/octet-stream"; // some devices send octet-stream

  if (!allowed) {
    return cb(Object.assign(new Error("Unsupported file type"), { statusCode: 400 }));
  }

  return cb(null, true);
}

// Main upload middleware with file type filter and size limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

// Upload middleware for doctor registration (multiple files)
export const doctorRegistrationUpload = upload.fields([
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
  { name: "secondaryId", maxCount: 1 },
  { name: "registrationCertificate", maxCount: 1 },
]);

// Upload middleware for doctor registration certificate (single file)
export const doctorRegistrationCertificateUpload = upload.single("registrationCertificate");

// Upload middleware for doctor identity documents (multiple files)
export const doctorIdentityDocsUpload = upload.fields([
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
  { name: "secondaryId", maxCount: 1 },
]);

// Upload middleware for profile photo (single file)
export const profilePhotoUpload = upload.single("profilePhoto");

export const chatPhotoUpload = upload.single("photo");
