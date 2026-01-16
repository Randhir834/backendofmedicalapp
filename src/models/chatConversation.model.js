import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    lastMessageText: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

chatConversationSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

const ChatConversation =
  mongoose.models.ChatConversation ||
  mongoose.model("ChatConversation", chatConversationSchema);

export default ChatConversation;
