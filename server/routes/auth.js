// TP: Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/jwt");
const configs = require("../configs/config.js");
const InvestmentType = require("../models/InvestmentType.js");
const Investment = require("../models/Investment.js");
const EventSeries = require("../models/EventSeries.js");
const Scenario = require("../models/Scenario.js");

// Signup Route
router.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ username });

        if (user) {
            return res.status(401).json({ error: "User already registered!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, password: hashedPassword });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Create and send JWT token
        const token = jwt.sign({ userId: user._id, username: user.username }, "secretKey");
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Google authentication route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback route
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/" }), (req, res) => {
    const token = jwt.sign({ userId: req.user._id, username: req.user.username }, "secretKey");
    res.redirect(`${configs.googleAuthClientSuccessURL}/success?token=${token}`);
});

// Success route
router.get("/success", (req, res) => {
    const { token } = req.query;
    // Render a success page or send a response with the token
    res.json({ message: "Authentication successful", token });
});

// Protected Route
router.get("/isAuthenticated", verifyToken, (req, res) => {
    res.status(200).json({
        message: "This is a protected endpoint",
        user: req.user,
    });
});

router.post("/updateAge", verifyToken, async (req, res) => {
    try {
        const { age } = req.body;

        // Update the user's age in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId, // Extracted from the JWT token
            { age },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Age updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating age:", error);
        res.status(500).json({ message: "Failed to update age" });
    }
});

// Protected - Create InvestmentType
router.post("/api/investmentTypes", verifyToken, async (req, res) => {
    try {
        const { name, description, expected_annual_return, expected_annual_income, returnType, incomeType, expense_ratio, taxability } = req.body;
        const investmentType = new InvestmentType({
            name,
            description,
            expected_annual_return,
            expected_annual_income,
            returnType,
            incomeType,
            expense_ratio,
            taxability,
        });
        await investmentType.save();
        res.status(201).json(investmentType);
    } catch (error) {
        res.status(500).json({ message: "Error creating InvestmentType", error });
    }
});

// Protected - Create Investment
router.post("/api/investments", verifyToken, async (req, res) => {
    try {
        const investment = new Investment({
            investmentType: req.body.investmentType,
            value: req.body.value,
            tax_status: req.body.tax_status,
            userId: req.user.userId,
        });

        await investment.save();
        res.status(201).json(investment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Protected - Get Investments
router.get("/api/investments", verifyToken, async (req, res) => {
    try {
        const investments = await Investment.find().exec();
        res.json(investments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch investments" });
    }
});

// Protected - Create EventSeries
router.post("/api/event-series", verifyToken, async (req, res) => {
    try {
        const newEventSeries = new EventSeries({
            ...req.body,
            userId: req.user.userId,
        });
        await newEventSeries.save();
        res.status(201).json({ message: "EventSeries created successfully", eventSeries: newEventSeries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Protected - Get Event Series
router.get("/api/event-series", verifyToken, async (req, res) => {
    try {
        const eventSeries = await EventSeries.find();
        res.json(eventSeries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST: Create scenario
router.post("/api/scenarioForm", verifyToken, async (req, res) => {
    try {
        // Create Investment document referencing the InvestmentType
        // console.log("REQUEST: ", req.body);
        // Object.entries(req.body).forEach(([key, value]) => {
        //     console.log("KEY: ", key);
        //     console.log("VALUE: ", typeof value);
        // });
        const scenario = new Scenario({
            name: req.body.name,
            marital_status: req.body.maritialStatus,
            birth_year: Number(req.body.birthYear),
            birth_year_spouse: Number(req.body.birthYear_spouse),

            life_expectancy: Number(req.body.lifeExpectancy_value),
            life_expectancy_mean: Number(req.body.life_expectancy_mean),
            life_expectancy_stdv: Number(req.body.life_expectancy_stdv),

            life_expectancy_spouse: Number(req.body.lifeExpectancy_value_spouse),
            life_expectancy_mean_spouse: Number(req.body.life_expectancy_mean_spouse),
            life_expectancy_stdv_spouse: Number(req.body.life_expectancy_stdv_spouse),

            investments: ["67eaa6b6074ecc89e2be6fbc"],
            event_series: ["67eaa6d3074ecc89e2be6fc0"],
            inflation_assumption: Number(req.body.inflation),
            init_limit_pretax: Number(req.body.pre_contribLimit),
            init_limit_aftertax: Number(req.body.after_contribLimit),
            spending_strategy: [1, 20, 35],
            expense_withdrawal_strategy: ["67eaa6b6074ecc89e2be6fbc"], // ["60b8d295f1b2c34d88f5e3b1"],
            roth_conversion_strategy: ["67eaa6b6074ecc89e2be6fbc"], // ["60b8d295f1b2c34d88f5e3b1"],
            rmd_strategy: ["67eaa6b6074ecc89e2be6fbc"], //req.body.rmd_strategy,
            roth_conversion_optimizer_settings: [100, 400, 2000, 2020], // req.body.has_rothOptimizer,
            sharing_settings: null,
            financial_goal: Number(req.body.financialGoal),
            state_of_residence: req.body.stateResidence,
            taxes: new Map() /*!!need algorithm*/,
            totalTaxedIncome: 0 /*!!need algorithm*/,
            totalInvestmentValue: 0 /*!!need algorithm*/,
        });
        console.log("SCENARIO: ", scenario);
        await scenario.save();
        console.log("saved");
        res.status(201).json(scenario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/api/profile", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.userId;
        const user = await User.findById(user_id);
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
