// InvestmentType Schema
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const InvestmentTypeSchema = new Schema({
        _id: {type: mongoose.Schema.Types.ObjectId, required: true},
        name: { type: String, required: true },
        description: {type: String, required: true},
        expected_annual_return: { type: mongoose.Schema.Types.Decimal128, required: true },
        age: {type: Number, required: true},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
        isAdmin: {type: Boolean, default: false}
    },
    { timestamps: true },
)
module.exports = mongoose.model('InvestmentType', InvestmentTypeSchema)
