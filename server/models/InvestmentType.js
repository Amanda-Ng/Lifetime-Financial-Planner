// InvestmentType Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const InvestmentTypeSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: false },
        expected_annual_return: { type: mongoose.Schema.Types.Decimal128, required: true },
        expense_ratio: { type: mongoose.Schema.Types.Decimal128, required: true },
        expected_annual_income: { type: mongoose.Schema.Types.Decimal128, required: true },
        taxability: {
            type: String,
            required: true
        },
        returnType: {
            type: String,
            enum: ["fixedAmount", "fixedPercentage", "randomAmount", "randomPercentage"],
            required: true,
        },
        incomeType: {
            type: String,
            enum: ["fixedAmount", "fixedPercentage", "randomAmount", "randomPercentage"],
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);
module.exports = mongoose.model("InvestmentType", InvestmentTypeSchema);
