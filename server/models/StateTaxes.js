const mongoose = require("mongoose");

const schema = mongoose.Schema;
const StateTaxesSchema = new schema(
    {
        year: { type: Number, required: true },
        state: { type: String, required: true },
        status: { type: String, required: true },
        brackets: { type: Map, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("StateTaxes", StateTaxesSchema);
