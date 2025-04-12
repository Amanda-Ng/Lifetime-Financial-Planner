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
        const investmentType = new InvestmentType({
            ...req.body,
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

router.get("/api/getUserInvestments", verifyToken, async (req, res) => {
    console.log("got req: getUserInvestments") 
    try {
        const user_id = req.user.userId;
        console.log("user id:" + user_id)
        const investments = await Investment.find({ userId: user_id}).populate("investmentType"); 
        res.json(investments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching user investments" });
    }
});

router.get("/api/getUserEvents", verifyToken, async (req, res) => {
    console.log("got req: getUserEvents") 
    try {
        const user_id = req.user.userId;
        console.log("user id:" + user_id)
        const events = await EventSeries.find({ userId: user_id}); 
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching user events" });
    }
});


// POST: Create scenario
router.post("/api/scenarioForm", verifyToken, async (req, res) => {
    try {
        let roth_settings = [];
        if(req.body.has_rothOptimizer===true){
            roth_settings = [
                Number(req.body.target_taxBrac),
                Number(req.body.roth_startYr),
                Number(req.body.roth_endYr),] 
        }
        const scenario = new Scenario({
            name: req.body.name,
            marital_status: req.body.maritalStatus,
            birth_year: req.body.birthYear,
            birth_year_spouse: req.body.birthYear_spouse,

            life_expectancy: req.body.lifeExpectancy_value,
            life_expectancy_mean: req.body.life_expectancy_mean,
            life_expectancy_stdv: req.body.life_expectancy_stdv,

            life_expectancy_spouse: req.body.lifeExpectancy_value_spouse,
            life_expectancy_mean_spouse: req.body.life_expectancy_mean_spouse,
            life_expectancy_stdv_spouse: req.body.life_expectancy_stdv_spouse,
 
            investments: req.body.investmentList, 
            event_series: req.body.events,
            inflation_assumption: req.body.inflation,
            init_limit_pretax: req.body.pre_contribLimit,
            init_limit_aftertax: req.body.after_contribLimit,
            spending_strategy: req.body.spendingStrat,
            expense_withdrawal_strategy: req.body.withdrawStrat,
            roth_conversion_optimizer_settings :roth_settings,
            roth_conversion_strategy: req.body.roth_conversion_strategy,
            rmd_strategy: req.body.rmd_strategy,  
                 
            read_only: req.body.read_only,
            read_write: req.body.read_write,
            financial_goal: req.body.financialGoal,
            state_of_residence: req.body.stateResidence,
            taxes: new Map() /*!!need algorithm*/,
            totalTaxedIncome: 0 /*!!need algorithm*/,
            totalInvestmentValue: 0 /*!!need algorithm*/,
            userId: req.user.userId,
        });
        await scenario.save();
        res.status(201).json(scenario);
    } catch (error) { 
        console.log(req.body)
        console.log({ message: error.message })
        res.status(400).json({ message: error.message });
    }
});

// PUT: Update scenario
router.put("/api/scenarioForm/:id", verifyToken, async (req, res) => {
    try {
        const scenario = await Scenario.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            marital_status: req.body.maritalStatus,
            birth_year: req.body.birth_year,
            birth_year_spouse: req.body.birth_year_spouse,

            life_expectancy: req.body.life_expectancy,
            life_expectancy_mean: req.body.life_expectancy_mean,
            life_expectancy_stdv: req.body.life_expectancy_stdv,

            life_expectancy_spouse: req.body.life_expectancy_spouse,
            life_expectancy_mean_spouse: req.body.life_expectancy_mean_spouse,
            life_expectancy_stdv_spouse: req.body.life_expectancy_stdv_spouse,

            investments: ["60b8d295f1b2c34d88f5e3b1"], //placeholder, needs to be replaced,
            event_series: ["60b8d295f1b2c34d88f5e3b1"],
            inflation_assumption: req.body.inflation_assumption,
            init_limit_pretax: req.body.init_limit_pretax,
            init_limit_aftertax: req.body.init_limit_aftertax,
            spending_strategy: ["60b8d295f1b2c34d88f5e3b1"],
            expense_withdrawal_strategy: ["60b8d295f1b2c34d88f5e3b1"],
            roth_conversion_strategy: ["60b8d295f1b2c34d88f5e3b1"],
            rmd_strategy: ["60b8d295f1b2c34d88f5e3b1"],
            roth_conversion_optimizer_settings: req.body.roth_conversion_optimizer_settings,
            read_only: req.body.read_only,
            read_write: req.body.read_write,
            financial_goal: req.body.financial_goal,
            state_of_residence: req.body.state_of_residence,
            taxes: req.body.taxes,
            totalTaxedIncome: req.body.totalTaxedIncome,
            totalInvestmentValue: req.body.totalInvestmentValue,
        }, { new: true });

        res.status(200).json(scenario);
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

// Protected - Get Scenarios
router.get("/api/scenarios", verifyToken, async (req, res) => {
    try {
        const scenarios = await Scenario.find();
        res.json(scenarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET editable scenarios (user owns or has read-write access)
router.get("/api/scenarios/editable", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.userId;
        const user = await User.findById(user_id);
        const user_email = user.email;

        const editableScenarios = await Scenario.find({
            $or: [
                { userId: user_id },
                { read_write: user_email }
            ]
        });

        res.json(editableScenarios);
    } catch (error) {
        console.error("Error fetching editable scenarios:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET read-only scenarios (user does not own, only has read-only access)
router.get("/api/scenarios/readonly", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.userId;
        const user = await User.findById(user_id);
        const user_email = user.email;

        const readOnlyScenarios = await Scenario.find({
            userId: { $ne: user_id },
            read_only: user_email
        });

        res.json(readOnlyScenarios);
    } catch (error) {
        console.error("Error fetching read-only scenarios:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
