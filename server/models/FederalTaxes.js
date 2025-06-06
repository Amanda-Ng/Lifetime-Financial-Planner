const mongoose = require("mongoose");

const schema = mongoose.Schema;
const FederalTaxesSchema = new schema(
    {
        year: { type: Number, required: true },
        single_federal_income_tax: { type: Map, required: true },
        married_federal_income_tax: { type: Map, required: true },
        single_standard_deductions: { type: Number, required: true },
        married_standard_deductions: { type: Number, required: true },
        single_capital_gains_tax: { type: Map, required: true },
        married_capital_gains_tax: { type: Map, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FederalTaxes", FederalTaxesSchema);
