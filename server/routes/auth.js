// TP: Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/jwt");
const configs = require("../configs/config.js");
const InvestmentType = require("../models/InvestmentType");
const Investment = require("../models/Investment");
const EventSeries = require("../models/EventSeries");

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
    // store Google auth token as session secret
    req.session.googleId = req.user.googleId; // google ID stored in session data to be accessed later to get user info
    req.session.secret = req.user.googleToken;

    req.session.save((error) => {
        if (error) {
            console.error("Error saving session:", error);
        } else {
            console.log("Session saved successfully:");
        }
    });
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

        console.log("Update");
        // Update the user's age in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId, // Extracted from the JWT token
            { age },
            { new: true } // Return the updated document
        );

        console.log("Check");
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("Done");
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
        const newEventSeries = new EventSeries(req.body);
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

router.get("/api/profile", async (req, res) => {
    console.log("Request:", req.session);
    try {
        if (!req.session || !req.session.googleId) {
            // if no session for current user, then do not get the data
            return res.status(401).json({ message: "Unauthorized: No session found" });
        }

        // retrieve user
        const user = await User.findOne({ googleId: req.session.googleId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
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
