// Investment Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const InvestmentSchema = new Schema(
    {
        // Renamed to "investmentType" from "type" in 9. Persistence on Design Docs
        investmentType: { type: mongoose.Schema.Types.ObjectId, ref: "InvestmentType", required: true },
        value: { type: Number, required: true },
        tax_status: { type: String, required: true },       //non-retirement,pre-tax retirement,after-tax retirement
        userId: { type: String, required: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Investment", InvestmentSchema);
