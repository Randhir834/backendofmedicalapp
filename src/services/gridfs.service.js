/**
 * tpex-healthcare-backend\src\services\gridfs.service.js
 *
 * Auto-generated documentation comments.
 */
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";

const BUCKET_NAME = process.env.GRIDFS_BUCKET || "uploads";

/**
 * getBucket.
 */
/**
 * getBucket.
 */
/**
 * getBucket.
 */
function getBucket() {
  if (!mongoose.connection?.db) {
    throw Object.assign(new Error("MongoDB not connected"), { statusCode: 500 });
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

/**
 * toObjectId.
 */
/**
 * toObjectId.
 */
/**
 * toObjectId.
 */
export function toObjectId(id) {
  try {
    return new ObjectId(String(id));
  } catch {
    return null;
  }
}

/**
 * uploadBuffer.
 */
/**
 * uploadBuffer.
 */
/**
 * uploadBuffer.
 */
export async function uploadBuffer({
  buffer,
  filename,
  contentType,
  metadata,
}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw Object.assign(new Error("Invalid file buffer"), { statusCode: 400 });
  }

  const bucket = getBucket();
  const readable = Readable.from(buffer);

  const uploadStream = bucket.openUploadStream(String(filename || "file"), {
    contentType: contentType || "application/octet-stream",
    metadata: metadata || {},
  });

  return new Promise((resolve, reject) => {
    readable
      .pipe(uploadStream)
      .on("error", (err) => reject(err))
      .on("finish", () => resolve(uploadStream.id));
  });
}

/**
 * getFileInfo.
 */
/**
 * getFileInfo.
 */
/**
 * getFileInfo.
 */
export async function getFileInfo(fileId) {
  const bucket = getBucket();
  const _id = toObjectId(fileId);
  if (!_id) {
    throw Object.assign(new Error("Invalid file id"), { statusCode: 400 });
  }

  const files = await bucket.find({ _id }).limit(1).toArray();
  return files.length ? files[0] : null;
}

/**
 * openDownloadStream.
 */
/**
 * openDownloadStream.
 */
/**
 * openDownloadStream.
 */
export function openDownloadStream(fileId) {
  const bucket = getBucket();
  const _id = toObjectId(fileId);
  if (!_id) {
    throw Object.assign(new Error("Invalid file id"), { statusCode: 400 });
  }
  return bucket.openDownloadStream(_id);
}

/**
 * deleteFile.
 */
/**
 * deleteFile.
 */
/**
 * deleteFile.
 */
export async function deleteFile(fileId) {
  const bucket = getBucket();
  const _id = toObjectId(fileId);
  if (!_id) {
    throw Object.assign(new Error("Invalid file id"), { statusCode: 400 });
  }
  return bucket.delete(_id);
}
