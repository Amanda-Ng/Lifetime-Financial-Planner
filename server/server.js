const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const InvestmentType = require("./models/InvestmentType");
const Investment = require("./models/Investment");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

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


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
    if (db) {
        db.close()
            .then(() => console.log("Database connection closed"))
            .catch((error) => console.log(error));
    }
    console.log("Process terminated");
});
