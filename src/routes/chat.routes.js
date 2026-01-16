import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { chatPhotoUpload } from "../middlewares/upload.middleware.js";
import {
  createOrGetConversation,
  downloadMessagePhoto,
  getConversationMessages,
  listMyConversations,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = Router();

router.get("/me", authMiddleware, listMyConversations);
router.post("/conversation", authMiddleware, createOrGetConversation);
router.get("/:id/messages", authMiddleware, getConversationMessages);
router.get("/:id/messages/:messageId/photo", authMiddleware, downloadMessagePhoto);
router.post("/:id/messages", authMiddleware, chatPhotoUpload, sendMessage);

export default router;
