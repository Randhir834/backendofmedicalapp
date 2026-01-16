 /**
  * Patient data model.
  *
  * Stores patient profile information linked to a User account.
  */
 import mongoose from "mongoose";

 /**
  * Mongoose schema for patient profiles.
  */
 const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    currentLocation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ email: 1 });

 /**
  * Patient mongoose model.
  */
 const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);

export default Patient;
