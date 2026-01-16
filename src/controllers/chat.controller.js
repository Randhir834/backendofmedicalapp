import mongoose from "mongoose";
import ChatConversation from "../models/chatConversation.model.js";
import ChatMessage from "../models/chatMessage.model.js";
import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { deleteFile, openDownloadStream, uploadBuffer } from "../services/gridfs.service.js";

function isValidObjectId(id) {
  return Boolean(id) && mongoose.Types.ObjectId.isValid(String(id));
}

async function resolveRequesterProfile({ userId }) {
  const [doctor, patient] = await Promise.all([
    Doctor.findOne({ userId }).select({ _id: 1, fullName: 1 }).lean(),
    Patient.findOne({ userId }).select({ _id: 1, fullName: 1, email: 1, phone: 1 }).lean(),
  ]);

  if (doctor) {
    return { role: "doctor", profile: doctor };
  }
  if (patient) {
    return { role: "patient", profile: patient };
  }
  return { role: null, profile: null };
}

async function ensureChatAllowed({ doctorId, patientId }) {
  return Appointment.exists({
    doctorId,
    patientId,
    status: { $ne: "cancelled" },
    consultationType: { $in: ["online_chat", "online_video"] },
  });
}

function mapConversation({ c, role, baseUrl }) {
  const doctor = c.doctorId || {};
  const patient = c.patientId || {};

  const doctorId = doctor?._id?.toString?.() ?? "";
  const patientId = patient?._id?.toString?.() ?? "";

  const doctorPhotoUrl = doctorId ? `${baseUrl}/doctors/${doctorId}/profile-photo` : "";
  const patientPhotoUrl =
    role === "doctor" && patientId
      ? `${baseUrl}/appointments/doctor/patients/${patientId}/profile-photo`
      : "";

  const peer =
    role === "doctor"
      ? {
          role: "patient",
          id: patientId,
          fullName: patient?.fullName ?? "",
          email: patient?.email ?? "",
          phone: patient?.phone ?? "",
          photoUrl: patientPhotoUrl,
        }
      : {
          role: "doctor",
          id: doctorId,
          fullName: doctor?.fullName ?? "",
          photoUrl: doctorPhotoUrl,
        };

  return {
    id: c._id?.toString?.() ?? "",
    doctor: {
      id: doctorId,
      fullName: doctor?.fullName ?? "",
      photoUrl: doctorPhotoUrl,
    },
    patient: {
      id: patientId,
      fullName: patient?.fullName ?? "",
      email: patient?.email ?? "",
      phone: patient?.phone ?? "",
      photoUrl: patientPhotoUrl,
    },
    peer,
    lastMessageText: c.lastMessageText ?? "",
    lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : null,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
  };
}

function roomName(conversationId) {
  return `conversation:${conversationId}`;
}

function userRoom({ role, profileId }) {
  return `user:${role}:${profileId}`;
}

function isAllowedChatPhotoUpload(file) {
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

function mapMessage({ m, baseUrl }) {
  const conversationId = m.conversationId?.toString?.() ?? "";
  const messageId = m._id?.toString?.() ?? "";
  const photoFileId = m?.photo?.fileId?.toString?.() ?? "";
  const photoUrl =
    m?.type === "image" && conversationId && messageId
      ? `${baseUrl}/chats/${conversationId}/messages/${messageId}/photo`
      : "";

  return {
    id: messageId,
    conversationId,
    senderRole: m.senderRole,
    senderProfileId: m.senderProfileId?.toString?.() ?? "",
    text: m.text ?? "",
    type: m.type ?? "text",
    photo: photoFileId
      ? {
          fileId: photoFileId,
          filename: m.photo?.filename ?? "",
          contentType: m.photo?.contentType ?? "",
          size: m.photo?.size ?? 0,
        }
      : null,
    photoUrl,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
  };
}

export async function listMyConversations(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { role, profile } = await resolveRequesterProfile({ userId });
    if (!role || !profile?._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const query = role === "doctor" ? { doctorId: profile._id } : { patientId: profile._id };
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const conversations = await ChatConversation.find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("doctorId", "fullName")
      .populate("patientId", "fullName email phone")
      .lean();

    const mapped = (conversations || []).map((c) => mapConversation({ c, role, baseUrl }));
    return res.status(200).json({ success: true, conversations: mapped });
  } catch (err) {
    return next(err);
  }
}

export async function createOrGetConversation(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { role, profile } = await resolveRequesterProfile({ userId });
    if (!role || !profile?._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const doctorId =
      role === "doctor" ? profile._id : String(req.body?.doctorId || "").trim();
    const patientId =
      role === "patient" ? profile._id : String(req.body?.patientId || "").trim();

    if (role === "doctor" && !isValidObjectId(patientId)) {
      return res.status(400).json({ success: false, message: "Valid patientId is required" });
    }
    if (role === "patient" && !isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: "Valid doctorId is required" });
    }

    const allowed = await ensureChatAllowed({ doctorId, patientId });
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Chat is only available for Online Consultant appointments",
      });
    }

    const conversation = await ChatConversation.findOneAndUpdate(
      { doctorId, patientId },
      { $setOnInsert: { doctorId, patientId } },
      { upsert: true, new: true }
    )
      .populate("doctorId", "fullName")
      .populate("patientId", "fullName email phone");

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.status(200).json({
      success: true,
      conversation: mapConversation({ c: conversation, role, baseUrl }),
    });
  } catch (err) {
    return next(err);
  }
}

export async function getConversationMessages(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { role, profile } = await resolveRequesterProfile({ userId });
    if (!role || !profile?._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const conversationId = String(req.params?.id || "").trim();
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Valid conversation id is required" });
    }

    const conversation = await ChatConversation.findById(conversationId)
      .select({ doctorId: 1, patientId: 1 })
      .lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const memberOk =
      (role === "doctor" && conversation.doctorId?.toString() === profile._id.toString()) ||
      (role === "patient" && conversation.patientId?.toString() === profile._id.toString());
    if (!memberOk) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 200);
    const before = String(req.query?.before || "").trim();

    const msgQuery = { conversationId };
    if (before && isValidObjectId(before)) {
      msgQuery._id = { $lt: before };
    }

    const rows = await ChatMessage.find(msgQuery)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.status(200).json({
      success: true,
      messages: (rows || []).reverse().map((m) => mapMessage({ m, baseUrl })),
    });
  } catch (err) {
    return next(err);
  }
}

export async function downloadMessagePhoto(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { role, profile } = await resolveRequesterProfile({ userId });
    if (!role || !profile?._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const conversationId = String(req.params?.id || "").trim();
    const messageId = String(req.params?.messageId || "").trim();
    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return res.status(400).json({ success: false, message: "Valid conversationId and messageId are required" });
    }

    const conversation = await ChatConversation.findById(conversationId)
      .select({ doctorId: 1, patientId: 1 })
      .lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const memberOk =
      (role === "doctor" && conversation.doctorId?.toString() === profile._id.toString()) ||
      (role === "patient" && conversation.patientId?.toString() === profile._id.toString());
    if (!memberOk) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const allowed = await ensureChatAllowed({ doctorId: conversation.doctorId, patientId: conversation.patientId });
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Chat is only available for Online Consultant appointments",
      });
    }

    const message = await ChatMessage.findOne({ _id: messageId, conversationId }).lean();
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const fileId = message?.photo?.fileId;
    if (!fileId) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    res.setHeader("Content-Type", message.photo?.contentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"${encodeURIComponent(message.photo?.filename || "photo")}\"`
    );

    const stream = openDownloadStream(fileId);
    stream.on("error", (err) => next(err));
    return stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

export async function sendMessage(req, res, next) {
  let newFileId = null;

  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { role, profile } = await resolveRequesterProfile({ userId });
    if (!role || !profile?._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const conversationId = String(req.params?.id || "").trim();
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Valid conversation id is required" });
    }

    const text = String(req.body?.text || "").trim();
    const clientMessageId = String(req.body?.clientMessageId || "").trim();
    const file = req.file;
    if (!text && !file) {
      return res.status(400).json({ success: false, message: "text or photo is required" });
    }

    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const memberOk =
      (role === "doctor" && conversation.doctorId?.toString() === profile._id.toString()) ||
      (role === "patient" && conversation.patientId?.toString() === profile._id.toString());
    if (!memberOk) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const allowed = await ensureChatAllowed({ doctorId: conversation.doctorId, patientId: conversation.patientId });
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Chat is only available for Online Consultant appointments",
      });
    }

    let photo = null;
    let type = "text";

    if (file) {
      if (!isAllowedChatPhotoUpload(file)) {
        return res.status(400).json({ success: false, message: "Unsupported file type" });
      }

      const filename = String(file.originalname || "photo").trim() || "photo";

      newFileId = await uploadBuffer({
        buffer: file.buffer,
        filename,
        contentType: file.mimetype,
        metadata: {
          field: "chatPhoto",
          conversationId: String(conversation._id),
          senderRole: String(role),
          senderProfileId: String(profile._id),
        },
      });

      type = "image";
      photo = {
        fileId: newFileId,
        filename,
        contentType: file.mimetype,
        size: file.size,
      };
    }

    const message = await ChatMessage.create({
      conversationId: conversation._id,
      senderRole: role,
      senderProfileId: profile._id,
      type,
      text: text || "",
      photo,
    });

    const lastText = type === "image" ? "Photo" : (text || "");
    conversation.lastMessageText = lastText;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const mapped = mapMessage({ m: message, baseUrl });

    const io = req.app?.get?.("io");
    if (io) {
      io.to(roomName(conversationId)).emit("message:new", {
        success: true,
        message: mapped,
        clientMessageId: clientMessageId || null,
      });
      io.to(userRoom({ role: "doctor", profileId: conversation.doctorId.toString() })).emit(
        "conversation:updated",
        {
          success: true,
          conversation: {
            id: conversation._id.toString(),
            lastMessageText: lastText,
            lastMessageAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
          },
        }
      );
      io.to(userRoom({ role: "patient", profileId: conversation.patientId.toString() })).emit(
        "conversation:updated",
        {
          success: true,
          conversation: {
            id: conversation._id.toString(),
            lastMessageText: lastText,
            lastMessageAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
          },
        }
      );
    }

    return res.status(201).json({ success: true, message: mapped, clientMessageId: clientMessageId || null });
  } catch (err) {
    if (newFileId) {
      await Promise.allSettled([deleteFile(newFileId)]);
    }
    return next(err);
  }
}
