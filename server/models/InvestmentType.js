// InvestmentType Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const InvestmentTypeSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: false },

        // Expected annual return
        expected_annual_return: { type: Number },
        expected_annual_return_mean: { type: Number },
        expected_annual_return_stdev: { type: Number },

        expense_ratio: { type: Number, required: true },

        // Expected Annual Income
        expected_annual_income: { type: Number },
        expected_annual_income_mean: { type: Number },
        expected_annual_income_stdev: { type: Number },

        taxability: {       //taxable, tax-exempt
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
        userId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);
module.exports = mongoose.model("InvestmentType", InvestmentTypeSchema);
