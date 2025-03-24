// Event Series Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const EventSeriesSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        start_year: { type: Number, required: true },
        duration: { type: Number, required: true },
        // Differed from 9. Persistence on Design Docs to allow populating data of the "event" from the corresponding "eventType"
        event: { type: mongoose.Schema.Types.ObjectId, refPath: "eventType", required: true },
        eventType: { type: String, required: true, enum: ["IncomeEvent", "ExpenseEvent", "InvestEvent", "RebalanceEvent"] },
    },
    { timestamps: true }
);
module.exports = mongoose.model("EventSeries", EventSeriesSchema);
