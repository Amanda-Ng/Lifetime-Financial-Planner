const mongoose = require("mongoose");

const schema = mongoose.Schema;
const StateTaxesSchema = new schema(
    {
        year: { type: Number, required: true },
        state: { type: String, required: true },
        single_tax_brackets: { type: Array, required: true },
        married_tax_brackets: { type: Array, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("StateTaxes", StateTaxesSchema);
