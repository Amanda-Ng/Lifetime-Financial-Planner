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
router.get("/google/callback", passport.authenticate("google", { session: true, failureRedirect: "/" }), (req, res) => {
    const token = jwt.sign({ userId: req.user._id, username: req.user.username }, "secretKey");
    // store Google auth token as session secret
    // console.log("User:", req.user);
    // req.session.googleId = req.user.googleId; // google ID stored in session data to be accessed later to get user info
    req.session.secret = token;

    req.session.save((error) => {
        if (error) {
            console.error("Error saving session:", error);
        } else {
            console.log("Session saved successfully:", req.session);
        }
    });

    console.log("Before redirect:", req.session);
    res.redirect(`${configs.googleAuthClientSuccessURL}/success?token=${token}`);
});

// Success route
router.get("/success", (req, res) => {
    const { token } = req.query;
    console.log("After redirect:", req.session);
    // Render a success page or send a response with the token
    res.json({ message: "Authentication successful", token });
});

// Protected Route
router.get("/isAuthenticated", verifyToken, (req, res) => {
    console.log("Authenticated:", req.session);
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
        const { name, description, returnType, incomeType, expected_annual_return, expected_annual_income, expense_ratio, taxability } = req.body;
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
router.post("/api/scenarioForm", async (req, res) => {
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
            taxes: null /*!!need algorithm*/,
            totalTaxedIncome: null /*!!need algorithm*/,
            totalInvestmentValue: null /*!!need algorithm*/,
        });

        await scenario.save();
        res.status(201).json(scenario);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/api/profile", async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/check-session", (req, res) => {
    if (req.session) {
        res.status(200).json({ session: req.session });
    } else {
        res.status(404).json({ message: "No session found" });
    }
});

module.exports = router;
