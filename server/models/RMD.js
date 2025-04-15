const mongoose = require("mongoose");

const schema = mongoose.Schema;
const RMDSchema = new schema(
    {
        year: { type: Number, required: true },
        distributions: { type: Map, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RMDs", RMDSchema);
