// User Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const UserSchema = new Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: false }, // Renamed from passwordHash to password and required false
        age: { type: Number, required: false }, // Required false

        // TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
        googleId: { type: String, unique: true },
        profilePicture: { type: String },
        //
        
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);
module.exports = mongoose.model("User", UserSchema);
