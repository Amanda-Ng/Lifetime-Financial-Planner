// Event Series Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const EventSeriesSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },

        // Start Year
        startYearType: { type: String, required: true },
        startYear: { type: Number },
        meanStartYear: { type: Number },
        stdDevStartYear: { type: Number },
        minStartYear: { type: Number },
        maxStartYear: { type: Number },
        anotherEventSeries: { type: String },

        // Duration
        durationType: { type: String, required: true },
        duration: { type: Number },
        meanDuration: { type: Number },
        stdDevDuration: { type: Number },
        minDuration: { type: Number },
        maxDuration: { type: Number },

        eventType: { type: String, required: true },
        userId: { type: String, required: true },

        // Optional fields depending on event type
        initialAmount: { type: Number },

        // Expected Annual Change
        expectedChangeType: { type: String },
        expectedChange: { type: Number },
        expectedChangeMean: { type: Number },
        expectedChangeStDev: { type: Number },
        expectedChangeMin: { type: Number },
        expectedChangeMax: { type: Number },

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
