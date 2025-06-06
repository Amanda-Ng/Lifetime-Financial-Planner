const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
require("./passport/passport");
const configs = require("./configs/config.js");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
//
const { spawn } = require("child_process"); // Import child_process

const FederalTaxes = require("./models/FederalTaxes.js");
const EventSeries = require("./models/EventSeries");
const Investment = require("./models/Investment");
const Scenario = require("./models/Scenario");

const app = express();
const PORT = configs.serverPort;

const allowed_origins = ["http://localhost:3000"];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowed_origins.indexOf(origin) === -1)
                return callback(new Error("CORS policy for rthis site does not allow access from the specified origin"), false);
            return callback(null, true);
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/scenarios", require("./routes/scenario.js"));
app.use("/api", require("./routes/simulation"));

// const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
// mongoose.connect(mongodb);

mongoose.connect(configs.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));
db.once("open", () => console.log("Connected to MongoDB"));

// Auth routes
// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
app.use("/auth", require("./routes/auth"));
//

// spawn tax_scraper.js as separate process
const taxScraperProcess = spawn("node", ["federal_tax_scraper.js"]);
taxScraperProcess.stdout.on("data", (data) => {
    console.log(`tax_scraper.js: ${data}`);
});
taxScraperProcess.stderr.on("data", (data) => {
    console.error(`tax_scraper.js error: ${data}`);
});
taxScraperProcess.on("close", (code) => {
    console.log(`tax_scraper.js process exited with code ${code}`);
});

const uploadStateTaxYaml = require("./routes/uploadStateTaxYaml");
app.use("/api/uploadStateTaxYaml", uploadStateTaxYaml);

const rmdProcess = spawn("node", ["scrape_rmd.js"]);
rmdProcess.stdout.on("data", (data) => {
    console.log(`scrape_rmd.js: ${data}`);
});
rmdProcess.stderr.on("data", (data) => {
    console.error(`scrape_rmd.js error: ${data}`);
});

rmdProcess.on("close", (code) => {
    console.log(`scrape_rmd.js process exited with code ${code}`);
});

app.get("/api/federalTaxes", async (req, res) => {
    console.log("Year: ", req.query.year);
    try {
        const {
            year,
            single_federal_income_tax,
            married_federal_income_tax,
            single_standard_deductions,
            married_standard_deductions,
            single_capital_gains_tax,
            married_capital_gains_tax,
        } = await FederalTaxes.findOne({ year: req.query.year });
        res.status(200).json({
            year,
            single_federal_income_tax,
            married_federal_income_tax,
            single_standard_deductions,
            married_standard_deductions,
            single_capital_gains_tax,
            married_capital_gains_tax,
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch tax data", error });
    }
});

app.delete("/api/deleteEvent/:id", async (req, res) => {
    try {
        const eventId = req.params.id;

        const deleted = await EventSeries.findOneAndDelete({ _id: eventId });

        if (!deleted) {
            return res.status(404).json({ error: "Event not found or not authorized." });
        }

        res.status(200).json({ message: "Event deleted successfully." });
    } catch (err) {
        console.error("Error deleting event:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.delete("/api/deleteInvestment/:id", async (req, res) => {
    try {
        const investmentId = req.params.id;

        const deleted = await Investment.findOneAndDelete({ _id: investmentId });

        if (!deleted) {
            return res.status(404).json({ error: "Investment not found." });
        }

        res.status(200).json({ message: "Investment deleted successfully." });
    } catch (err) {
        console.error("Error deleting investment:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.delete("/api/deleteScenario/:id", async (req, res) => {
    try {
        const scenarioId = req.params.id;

        const deleted = await Scenario.findOneAndDelete({ _id: scenarioId });

        if (!deleted) {
            return res.status(404).json({ error: "Scenario not found." });
        }

        res.status(200).json({ message: "Scenario deleted successfully." });
    } catch (err) {
        console.error("Error deleting scenario:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// // POST: Create InvestmentType
// app.post("/api/investmentTypes", async (req, res) => {
//     try {
//         const { name, description, returnType, incomeType, expected_annual_return, expected_annual_income, expense_ratio, taxability } = req.body;

//         const investmentType = new InvestmentType({
//             name,
//             description,
//             returnType,
//             incomeType,
//             expected_annual_return,
//             expected_annual_income,
//             expense_ratio,
//             taxability,
//         });

//         await investmentType.save();

//         return res.status(201).json(investmentType); // Return the created InvestmentType
//     } catch (error) {
//         console.error("Error creating InvestmentType:", error); // Log the error to the server console
//         return res.status(500).json({ message: "Error creating InvestmentType", error });
//     }
// });

// // POST: Create Investment
// app.post("/api/investments", async (req, res) => {
//     try {
//         // Create Investment document referencing the InvestmentType
//         const investment = new Investment({
//             investmentType: req.body.investmentType, // ObjectId of InvestmentType
//             value: req.body.value,
//             tax_status: req.body.tax_status,
//             userId: "Guest",
//         });

//         await investment.save();
//         res.status(201).json(investment);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });

// // POST: Create scenario
// //60b8d295f1b2c34d88f5e3b1 is a placeholder for object id
// app.post("/api/scenarioForm", async (req, res) => {
//     console.log("submitting scenario");
//     console.log("body is");
//     console.log(req.body);
//     try {
//         // Create Investment document referencing the InvestmentType
//         const scenario = new Scenario({
//             name: req.body.name,
//             marital_status: req.body.maritialStatus,
//             birth_year: req.body.birthYear,
//             birth_year_spouse: req.body.birthYear_spouse,

//             life_expectancy: req.body.lifeExpectancy_value,
//             life_expectancy_mean: req.body.life_expectancy_mean,
//             life_expectancy_stdv: req.body.life_expectancy_stdv,

//             life_expectancy_spouse: req.body.lifeExpectancy_value_spouse,
//             life_expectancy_mean_spouse: req.body.life_expectancy_mean_spouse,
//             life_expectancy_stdv_spouse: req.body.life_expectancy_stdv_spouse,

//             investments: ["60b8d295f1b2c34d88f5e3b1"],
//             event_series: ["60b8d295f1b2c34d88f5e3b1"],
//             inflation_assumption: req.body.inflation,
//             init_limit_pretax: req.body.pre_contribLimit,
//             init_limit_aftertax: req.body.after_contribLimit,
//             spending_strategy: ["60b8d295f1b2c34d88f5e3b1"],
//             expense_withdrawal_strategy: ["60b8d295f1b2c34d88f5e3b1"],
//             roth_conversion_strategy: ["60b8d295f1b2c34d88f5e3b1"],
//             rmd_strategy: req.body.rmd_strategy,
//             roth_conversion_optimizer_settings: req.body.has_rothOptimizer,
//             sharing_settings: null,
//             financial_goal: req.body.financialGoal,
//             state_of_residence: req.body.stateResidence,
//             taxes: new Map() /*!!need algorithm*/,
//             totalTaxedIncome: 0 /*!!need algorithm*/,
//             totalInvestmentValue: 0 /*!!need algorithm*/,
//         });
//         await scenario.save();
//         res.status(201).json(scenario);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });

module.exports = app;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
    try {
        if (db) {
            await db.close(); // Wait for the database connection to close
            console.log("Database connection closed");
        }
    } catch (error) {
        console.error("Error closing database connection:", error);
    } finally {
        console.log("Process terminated");
        process.exit(0); // Explicitly exit the process
    }
});
