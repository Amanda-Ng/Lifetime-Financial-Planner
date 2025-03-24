const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const InvestmentType = require("./models/InvestmentType");
const Investment = require("./models/Investment");
const EventSeries = require("./models/EventSeries");

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

// POST: Create InvestmentType
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

// GET: Gets Investments
app.get("/api/investments", async (req, res) => {
    try {
        const investments = await Investment.find().exec();

        res.json(investments);
    } catch (error) {
        console.error("Error fetching investments:", error);
        res.status(500).json({ error: "Failed to fetch investments" });
    }
});

// POST /api/event-series - Create a new EventSeries
app.post("/api/event-series", async (req, res) => {
    try {
        const {
            name,
            description,
            startYearType,
            startYear,
            durationType,
            duration,
            eventType,
            initialAmount,
            expectedChangeType,
            expectedChange,
            inflationAdjustment,
            isMarried,
            userPercentage,
            isSocialSecurity,
            isDiscretionary,
            assetAllocationType,
            maxCash,
            fixedAllocation,
            initialAllocation,
            finalAllocation,
        } = req.body;

        const newEventSeries = new EventSeries({
            name,
            description,
            startYearType,
            startYear,
            durationType,
            duration,
            eventType,
            initialAmount,
            expectedChangeType,
            expectedChange,
            inflationAdjustment,
            isMarried,
            userPercentage,
            isSocialSecurity,
            isDiscretionary,
            assetAllocationType,
            maxCash,
            fixedAllocation,
            initialAllocation,
            finalAllocation,
        });

        await newEventSeries.save();

        res.status(201).json({ message: "EventSeries created successfully", eventSeries: newEventSeries });
    } catch (error) {
        console.error("Error creating EventSeries:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET: Gets Event Series
app.get("/api/event-series", async (req, res) => {
    try {
        const eventSeries = await EventSeries.find();
        res.json(eventSeries);
    } catch (error) {
        console.error("Error fetching event series:", error);
        res.status(500).json({ message: "Server error" });
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
