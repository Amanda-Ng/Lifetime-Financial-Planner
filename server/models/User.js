// User Schema
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const UserSchema = new Schema({
        _id: {type: mongoose.Schema.Types.ObjectId, required: true},
        username: { type: String, required: true },
        email: {type: String, required: true},
        passwordHash: { type: String, required: true },
        age: {type: Number, required: true},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
        isAdmin: {type: Boolean, default: false}
    },
    { timestamps: true },
)
module.exports = mongoose.model('User', UserSchema)
