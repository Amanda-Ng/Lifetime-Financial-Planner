// Scenario Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ScenarioSchema = new Schema(
    {
        name: { type: String, required: true },
        marital_status: { type: String, required: true },
        birth_year: { type: Number, required: true }, // Changed from List<Integer> on 9. Persistence
        birth_year_spouse: { type: Number, required: false }, // Changed from List<Integer> on 9. Persistence
        life_expectancy: { type: Number, required: false },
        life_expectancy_mean: { type: Number, required: false },
        life_expectancy_stdv: { type: Number, required: false },
        life_expectancy_spouse: { type: Number, required: false },
        investments: { type: [mongoose.Schema.Types.ObjectId], ref: "Investment", required: true },
        event_series: { type: [mongoose.Schema.Types.ObjectId], ref: "EventSeries", required: true },
        inflation_assumption: { type: Number, required: true },
        init_limit_pretax: { type: mongoose.Schema.Types.Decimal128, required: true },
        init_limit_aftertax: { type: mongoose.Schema.Types.Decimal128, required: true },
        spending_strategy: { type: [Number], required: true },
        expense_withdrawal_strategy: { type: [mongoose.Schema.Types.ObjectId], ref: "Investment", required: true },
        roth_conversion_strategy: { type: [mongoose.Schema.Types.ObjectId], ref: "Investment", required: true },
        rmd_strategy: { type: [mongoose.Schema.Types.ObjectId], ref: "Investment", required: true },
        roth_conversion_optimizer_settings: { type: [Number], required: true, default: null },
        sharing_settings: { type: Map, required: false },
        financial_goal: { type: mongoose.Schema.Types.Decimal128, required: true },
        state_of_residence: { type: String, required: true },
        taxes: { type: Map, required: true },
        totalTaxedIncome: { type: mongoose.Schema.Types.Decimal128, required: true },
        totalInvestmentValue: { type: mongoose.Schema.Types.Decimal128, required: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Scenario", ScenarioSchema);
