const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
require("./passport/passport");
const passport = require("passport");
const configs = require("./configs/config.js");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
//
const { spawn } = require("child_process"); // Import child_process

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

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

// spawn parse_state_yaml_file.js as separate process
const parseStateYamlProcess = spawn("node", ["parse_state_yaml_file.js"]);
parseStateYamlProcess.stdout.on("data", (data) => {
    console.log(`parse_state_yaml_file.js: ${data}`);
});
parseStateYamlProcess.stderr.on("data", (data) => {
    console.error(`parse_state_yaml_file.js error: ${data}`);
});
parseStateYamlProcess.on("close", (code) => {
    console.log(`parse_state_yaml_file.js process exited with code ${code}`);
});
app.post("/api/investmentTypes", async (req, res) => {
    try {
        const {
            name,
            description,
            returnType,
            incomeType,
            expected_annual_return,
            expected_annual_income,
            expense_ratio,
            taxability,
        } = req.body;

        const investmentType = new InvestmentType({
            name,
            description,
            returnType,
            incomeType,
            expected_annual_return,
            expected_annual_income,
            expense_ratio,
            taxability,
        });

        await investmentType.save();

        return res.status(201).json(investmentType); // Return the created InvestmentType
    } catch (error) {
        console.error("Error creating InvestmentType:", error); // Log the error to the server console
        return res.status(500).json({ message: "Error creating InvestmentType", error });
    }
});

// POST: Create Investment
app.post("/api/investments", async (req, res) => {
    try {
        // Create Investment document referencing the InvestmentType
        const investment = new Investment({
            investmentType: req.body.investmentType, // ObjectId of InvestmentType
            value: req.body.value,
            tax_status: req.body.tax_status,
        });

        await investment.save();
        res.status(201).json(investment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// POST: Create scenario
app.post("/api/scenario", async (req, res) => {
    try {
        // Create Investment document referencing the InvestmentType
        const scenario = new Scenario({
            name: req.body.name, 
            marital_status: req.body.maritialStatus,
            birth_year: req.body.birthYear,
            birth_year_spouse: req.body.birthYear_spouse, 

            life_expectancy: req.body.lifeExpectancy_value,
            life_expectancy_mean: req.body.life_expectancy_mean,
            life_expectancy_stdv: req.body.life_expectancy_stdv, 

            life_expectancy_spouse: req.body.lifeExpectancy_value_spouse,
            life_expectancy_mean_spouse: req.body.life_expectancy_mean_spouse,
            life_expectancy_stdv_spouse: req.body.life_expectancy_stdv_spouse,

            investments: req.body.investmentList,
            event_series: req.body.event_series,
            inflation_assumption: req.body.inflation,
            init_limit_pretax: req.body.pre_contribLimit,
            init_limit_aftertax: req.body.after_contribLimit,
            spending_strategy: req.body.spendingStrat, 
            expense_withdrawal_strategy: req.body.withdrawStrat,
            roth_conversion_strategy: [req.body.roth_startYr, req.body.roth_endYr],
            rmd_strategy: req.body.rmd_strategy,
            roth_conversion_optimizer_settings: req.body.has_rothOptimizer,
            sharing_settings: null,
            financial_goal: req.body.financialGoal,
            state_of_residence: req.body.stateResidence,
            taxes: null,        /*!!need algorithm*/
            totalTaxedIncome: null, /*!!need algorithm*/
            totalInvestmentValue: null, /*!!need algorithm*/ 
        });

        await scenario.save(); 
        res.status(201).json(scenario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 
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
