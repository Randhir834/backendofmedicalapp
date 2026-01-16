 /**
  * User data model.
  *
  * Represents an authenticated account identified by email.
  * Stores optional profile photo metadata (backed by GridFS).
  */
 import mongoose from "mongoose";

 /**
  * Mongoose schema for users.
  */
 const userSchema = new mongoose.Schema(
   {
     email: {
       type: String,
       required: true,
       unique: true,
       lowercase: true,
       trim: true,
     },
     lastLoginAt: {
       type: Date,
       default: null,
     },
     profilePhoto: {
       fileId: {
         type: mongoose.Schema.Types.ObjectId,
         default: null,
       },
       filename: {
         type: String,
         default: null,
       },
       contentType: {
         type: String,
         default: null,
       },
       size: {
         type: Number,
         default: null,
       },
     },
   },
   {
     timestamps: true,
   }
 );

 /**
  * User mongoose model.
  */
 const User = mongoose.models.User || mongoose.model("User", userSchema);

 export default User;
