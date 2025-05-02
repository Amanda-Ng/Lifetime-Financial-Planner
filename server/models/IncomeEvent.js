// Income Event Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const IncomeEventSchema = new Schema(
    {
        initial: { type: Number, required: true },
        expected_annual_change: { type: Number, required: true },
        inflation_adjustment: { type: Boolean, required: true },
        user_spouse_ratio: { type: Number, required: true },
        //REVIEW Is this Necessary? if its stored in the "parent" collection EventSeries
        type: { type: String, required: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("IncomeEvent", IncomeEventSchema);
