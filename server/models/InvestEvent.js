// Invest Event Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const InvestEventSchema = new Schema(
    {
        asset_allocation: { type: Map, required: true },
        max_cash: { type: Number, required: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("InvestEvent", InvestEventSchema);
