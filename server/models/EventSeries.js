// Event Series Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const EventSeriesSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        startYearType: { type: String, required: true },
        startYear: { type: Number, required: true },

        durationType: { type: String, required: true },
        duration: { type: Number, required: true },

        eventType: { type: String, required: true },
        userId: { type: String, required: true },

        // Optional fields depending on event type
        initialAmount: { type: Number },
        expectedChangeType: { type: String },
        expectedChange: { type: Number },

        inflationAdjustment: { type: Boolean },
        isMarried: { type: Boolean },
        userPercentage: { type: Number },
        isSocialSecurity: { type: Boolean },
        isDiscretionary: { type: Boolean },

        assetAllocationType: { type: String },
        maxCash: { type: Number },
        fixedAllocation: { type: [Number] },
        initialAllocation: { type: [Number] },
        finalAllocation: { type: [Number] },
    },
    { timestamps: true }
);
module.exports = mongoose.model("EventSeries", EventSeriesSchema);
