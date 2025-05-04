// TP: Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/jwt");
const configs = require("../configs/config.js");

const multer = require("multer");
const fs = require("fs");
const yaml = require("js-yaml");
//storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/uploads");
    }
});
const upload = multer({ storage });
if (!fs.existsSync("/uploads")) {
    fs.mkdirSync("/uploads");
}

const InvestmentType = require("../models/InvestmentType.js");
const Investment = require("../models/Investment.js");
const EventSeries = require("../models/EventSeries.js");
const Scenario = require("../models/Scenario.js");
const StateTaxes = require("../models/StateTaxes.js");
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
            userId: req.user.userId
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
    console.log("got req: getUserInvestments");
    try {
        const user_id = req.user.userId;
        console.log("user id:" + user_id);
        const investments = await Investment.find({ userId: user_id }).populate("investmentType");
        res.json(investments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching user investments" });
    }
});

router.get("/api/getUserEvents", verifyToken, async (req, res) => {
    console.log("got req: getUserEvents");
    try {
        const user_id = req.user.userId;
        console.log("user id:" + user_id);
        const events = await EventSeries.find({ userId: user_id });
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching user events" });
    }
});

// POST: Create scenario
router.post("/api/scenarioForm", verifyToken, async (req, res) => {
    console.log(req.body);
    try {
        let roth_settings = [];
        if (req.body.has_rothOptimizer === "rothOptimizer_on") {
            roth_settings = [Number(req.body.target_taxBrac), Number(req.body.roth_startYr), Number(req.body.roth_endYr)];
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

            infl_type: req.body.infl_type,
            infl_value: req.bodyinfl_value,
            infl_mean: req.body.infl_mean,
            infl_stdev: req.body.infl_stdev,
            infl_min: req.body.infl_min,
            infl_max: req.body.infl_max,

            init_limit_pretax: req.body.pre_contribLimit,
            init_limit_aftertax: req.body.after_contribLimit,
            spending_strategy: req.body.spendingStrat,
            expense_withdrawal_strategy: req.body.withdrawStrat,
            roth_conversion_optimizer_settings: roth_settings,
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
        console.log("SCENARIO: ", scenario);
        await scenario.save();
        console.log("saved");
        res.status(201).json(scenario);
    } catch (error) {
        console.log(req.body);
        console.log({ message: error.message });
        res.status(400).json({ message: error.message });
    }
});

router.get("/api/tax-brackets", verifyToken, async (req, res) => {
    try {
        const { stateResidence, year } = req.query;
        if (!stateResidence) return res.json(null);
        let state_str = stateResidence.replace(" ", "_").toLowerCase() + "_tax_rates";

        const stateTax = await StateTaxes.findOne({ state: state_str, year: year });

        if (!stateTax) {
            console.log("No tax brackets found for that state and year: " + state_str + " " + year);
            return res.status(404).json({ error: "No tax brackets found for that state and year" });
        }
        res.json(stateTax);
    } catch (error) {
        console.error("Error fetching tax brackets:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// PUT: Update scenario
router.put("/api/scenarioForm/:id", verifyToken, async (req, res) => {
    try {
        let roth_settings = [];
        if (req.body.has_rothOptimizer === "rothOptimizer_on") {
            roth_settings = [Number(req.body.target_taxBrac), Number(req.body.roth_startYr), Number(req.body.roth_endYr)];
        }

        const scenario = await Scenario.findByIdAndUpdate(
            req.params.id,
            {
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

                infl_type: req.body.infl_type,
                infl_value: req.body.infl_value,
                infl_mean: req.body.infl_mean,
                infl_stdev: req.body.infl_stdev,
                infl_min: req.body.infl_min,
                infl_max: req.body.infl_max,

                init_limit_pretax: req.body.pre_contribLimit,
                init_limit_aftertax: req.body.after_contribLimit,
                spending_strategy: req.body.spendingStrat,
                expense_withdrawal_strategy: req.body.withdrawStrat,
                roth_conversion_optimizer_settings: roth_settings,
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
            },
            { new: true }
        );

        res.status(200).json(scenario);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

router.post("/api/importScenario", verifyToken, upload.single("file"), async (req, res) => {
    console.log("importing scenario...")
    console.log("req.file is:", req.file);
    const filePath = req.file.path;
    try {
        //read file
        const yamlContent = fs.readFileSync(filePath, "utf8");
        const data = yaml.load(yamlContent);
        //parse file
        let married
        if (data.maritalStatus == "couple") {
            maritalStatus = "married"
            married = true
        } else {
            maritalStatus = "single"
            married = false
        }
        let error = {};

        //check dupe investment type name 
        for (const invType of data.investmentTypes || []) {
            const exists = await InvestmentType.exists({ name: invType.name, userId: req.user.userId });
            if (exists) {
                error.message = `Investment Type with name: "${invType.name}" already exists.`;
                console.log(error.message);
                res.status(400).json({ message: error.message });
                return;
            }
            //create investmentTypes
            //!!map exported var names to schema var name
            let returnType
            let expected_annual_return_mean = null
            let expected_annual_return_stdev = null
            let expected_annual_return = null
            if (invType.returnDistribution.type == "normal") {
                expected_annual_return_mean = invType.returnDistribution.mean
                expected_annual_return_stdev = invType.returnDistribution.stdev
                returnType = "random"
            } else {
                expected_annual_return = invType.returnDistribution.value
                returnType = "fixed"
            }
            if (invType.returnAmtOrPct == "amount") {
                returnType += "Amount"
            } else {
                returnType += "Percent"
            }

            //income
            let incomeType
            let expected_annual_income_mean = null
            let expected_annual_income_stdev = null
            let expected_annual_income = null
            if (invType.returnDistribution.type == "normal") {
                expected_annual_income_mean = invType.incomeDistribution.mean
                expected_annual_income_stdev = invType.incomeDistribution.stdev
                incomeType = "random"
            } else {
                expected_annual_income = invType.incomeDistribution.value
                incomeType = "fixed"
            }
            if (invType.incomeAmtOrPct == "amount") {
                incomeType += "Amount"
            } else {
                incomeType += "Percentage"
            }

            const newType = new InvestmentType({
                ...invType,
                returnType: returnType,
                expected_annual_return: expected_annual_return,
                expected_annual_return_mean: expected_annual_return_mean,
                expected_annual_return_stdev: expected_annual_return_stdev,
                expense_ratio: invType.expenseRatio,
                incomeType: incomeType,
                expected_annual_income: expected_annual_income,
                expected_annual_income_mean: expected_annual_income_mean,
                expected_annual_income_stdev: expected_annual_income_stdev,
                userId: req.user.userId,
                isAdmin: false
            });
            console.log("new investmentType")
            console.log(newType)
            await newType.save()
        }
        //check if investments are valid 
        let newInvests = [];
        for (const inv of data.investments || []) {
            //check id
            const exists = await Investment.exists({ _id: inv.id });
            if (!exists) {
                error.message = "Investment with ID with type: ${inv.investmentType} and value: ${inv.value} not found.";
                console.log(error.message)
                res.status(400).json({ message: error.message });
                return
            }
            //replace investmentType name with id
            const invType = await InvestmentType.findOne({ name: inv.investmentType });
            inv.investmentType = invType._id
            //save invest 
            const newInv = new Investment({
                ...inv,
                tax_status: inv.taxStatus,
                userId: req.user.userId
            });
            newInvests.push(newInv._id)
            await newInv.save()
        }

        //check if events are valid  
        let newEvents = []
        for (const event of data.eventSeries || []) {
            const exists = await EventSeries.exists({ name: event.name, userId: req.user.userId });
            //check dupe
            if (exists) {
                error.message = `Event with name: "${event.name}" already exists.`;
                console.log(error.message);
                res.status(400).json({ message: error.message });
                return;
            }
            //startYearType: 
            //  schema： fixed, normal, uniform, sameAsAnotherEvent,yearAfterAnotherEvent
            //  yaml:    fixed,  normal,uniform, startWith,         startAfter 
            let startYearType = event.start.type
            let startYear
            let anotherEventSeries
            switch (event.start) {
                case "startWith":
                    startYearType = "sameAsAnotherEvent"
                    anotherEventSeries = await EventSeries.findOne({ name: event.name, userId: req.user.userId });
                    if (!anotherEventSeries) {
                        error.message = `Event with name: "${data.name}" depends on undefined event "${event.name}".`;
                        console.log(error.message)
                        res.status(400).json({ message: error.message });
                    }
                    break;
                case "startAfter":
                    startYearType = "sameAsAnotherEvent"
                    anotherEventSeries = await EventSeries.findOne({ name: event.name, userId: req.user.userId });
                    if (!anotherEventSeries) {
                        error.message = `Event with name: "${data.name}" depends on undefined event "${event.name}".`;
                        console.log(error.message)
                        res.status(400).json({ message: error.message });
                    }
            }
            //expectedChangeType: 
            //  schema: fixedAmount,fixedPercentage,randomAmount,uniformAmount,randomPercentage,uniformPercentage 
            //yaml: changeDistribution.type: fixed, normal, uniform
            //yaml: changeAmtOrPct: amount, percent
            let expectedChangeType = ""
            let path
            let fixedAllocation
            let initialAllocation
            let allocArr1
            let allocArr2
            if (event.type == "income" || event.type == "expense") {
                if (event.changeDistribution.type == "normal") {
                    expectedChangeType += "uniform"
                } else {
                    expectedChangeType += event.changeDistribution.type
                }
                if (event.changeAmtOrPct == "amount") {
                    expectedChangeType += "Amount"
                } else {
                    expectedChangeType += "Percentage"
                }
            } else {
                const userInvests = await Investment.find({ userId: req.user.userId }).populate("investmentType");
                console.log("userInvests:", userInvests);
                const investmentTypeNames = userInvests.map(inv => inv.investmentType.name).filter(Boolean);

                console.log("Investment Type Names:", investmentTypeNames);

                allocArr1 = Array(investmentTypeNames.size).fill(null);
                for (const [assetName, allocationValue] of Object.entries(event.assetAllocation || {})) {
                    console.log("alloc1: " + assetName)
                    const index = investmentTypeNames.indexOf(assetName);
                    if (index !== -1) {
                        allocArr1[index] = allocationValue;
                    }
                }
                allocArr2 = Array(investmentTypeNames.size).fill(null);
                for (const [assetName, allocationValue] of Object.entries(event.assetAllocation2 || {})) {
                    console.log("alloc2: " + assetName)
                    const index = investmentTypeNames.indexOf(assetName);
                    if (index !== -1) {
                        allocArr2[index] = allocationValue;
                    }
                }
                if (event.glidePath == true) {
                    path = "glidepath"
                    initialAllocation = allocArr1
                } else {
                    path = "fixed"
                    fixedAllocation = allocArr1
                }
            }

            let isMarried = false
            if (data.maritalStatus == "couple") {
                isMarried = true
            }
            //create new event
            const newEvent = new EventSeries({
                ...event,
                startYearType: startYearType,
                startYear: startYear ?? null,
                meanStartYear: event.start.mean ?? null,
                stdDevStartYear: event.start.stdev ?? null,
                minStartYear: event.start.lower ?? null,
                maxStartYear: event.start.upper ?? null,
                anotherEventSeries: anotherEventSeries ?? null,

                durationType: event.duration.type,
                duration: event.duration.value.value ?? null,
                meanDuration: event.duration.mean ?? null,
                stdDevDuration: event.duration.std ?? null,
                minDuration: event.duration.min ?? null,
                maxDuration: event.duration.max ?? null,

                eventType: event.type,
                userId: req.user.userId,

                initialAmount: event.initialAmount ?? null,

                expectedChangeType: expectedChangeType ?? null,
                expectedChange: event.changeDistribution?.value?.value ?? null,
                meanExpectedChange: event.changeDistribution?.mean ?? null,
                stdDevExpectedChange: event.changeDistribution?.stdev ?? null,
                minExpectedChange: event.changeDistribution?.min ?? null,
                maxExpectedChange: event.changeDistribution?.max ?? null,

                inflationAdjustment: event.inflationAdjusted ?? null,
                isMarried: isMarried,
                userPercentage: event.userFraction ?? null,
                isSocialSecurity: event.socialSecurity ?? null,
                isDiscretionary: event.discretionary ?? null,

                assetAllocationType: path ?? null,
                maxCash: event.maxCash ?? null,
                fixedAllocation: fixedAllocation ?? null,
                initialAllocation: allocArr1,
                finalAllocation: allocArr2,

                userId: req.user.userId
            });
            newEvents.push(newEvent._id)
            await newEvent.save()
        }
        //check dupe scenario name
        const scenarioExists = await Scenario.exists({ name: data.name, userId: req.user.userId });
        if (scenarioExists) {
            error.message = `Scenario with name: "${data.name}" already exists.`;
            console.log(error.message)
            res.status(400).json({ message: error.message });
            return;
        }
        //spending strategy: get list of obj id by name
        let spending_strategy = []
        for (const name of data.spendingStrategy || []) {
            const event = await EventSeries.findOne({ name, userId: req.user.userId });
            if (event) {
                spending_strategy.push(event._id);
            } else {
                return res.status(400).json({ message: `Spending Strategy: event with name "${name}" not found.` });
            }
        }
        //expenseWithdrawalStrategy: find investments 
        let expenseWithdrawalStrategy = []
        for (const id of data.expenseWithdrawalStrategy || []) {
            const inv = await Investment.findById(id);
            if (inv) {
                expenseWithdrawalStrategy.push(inv._id);
            } else {
                return res.status(400).json({ message: `Expense Withdrawal Strategy: investment not found.` });
            }
        }
        //RMDStrategy:find investments 
        let RMDStrategy = []
        for (const id of data.RMDStrategy || []) {
            const inv = await Investment.findById(id);
            if (inv) {
                RMDStrategy.push(inv._id);
            } else {
                return res.status(400).json({ message: `RMD Strategy: investment not found.` });
            }
        }
        //RothConversionStrategy: find investments 
        let RothConversionStrategy = []
        for (const id of data.RothConversionStrategy || []) {
            const inv = await Investment.findById(id);
            if (inv) {
                RothConversionStrategy.push(inv._id);
            } else {
                return res.status(400).json({ message: `Roth Conversion Strategy: investment not found.` });
            }
        }

        const scenario = new Scenario({
            name: data.name,
            marital_status: maritalStatus,
            birth_year: data.birthYears[0],
            birth_year_spouse: married ? data.birthYears[1] : null,

            life_expectancy: data.lifeExpectancy[0].value ?? null,
            life_expectancy_mean: data.lifeExpectancy[0].mean ?? null,
            life_expectancy_stdv: data.lifeExpectancy[0].stdev ?? null,
            life_expectancy_spouse: married
                ? data.lifeExpectancy[1].value ?? null
                : null,

            // These will need to be populated via references
            investments: newInvests,
            event_series: newEvents,
            inflation_assumption: data.inflationAssumption.value,
            init_limit_pretax: 0,       //not in scenario yaml 
            init_limit_aftertax: data.afterTaxContributionLimit,
            spending_strategy: spending_strategy,
            expense_withdrawal_strategy: expenseWithdrawalStrategy,
            roth_conversion_strategy: RothConversionStrategy,
            rmd_strategy: RMDStrategy,
            roth_conversion_optimizer_settings: [
                data.RothConversionOpt ? 1 : 0,     //!! no tax brackets 
                data.RothConversionStart,
                data.RothConversionEnd,
            ],

            //inflation 
            infl_type: data.inflationAssumption.type ?? null,
            infl_value: data.inflationAssumption.value ?? null,
            infl_mean: data.inflationAssumption.mean ?? null,
            infl_stdev: data.inflationAssumption.stdev ?? null,
            infl_min: data.inflationAssumption.lower ?? null,
            infl_max: data.inflationAssumption.upper ?? null,

            sharing_settings: new Map(),        //sharing isn't inherited
            financial_goal: data.financialGoal,
            state_of_residence: data.residenceState,
            taxes: new Map(),
            totalTaxedIncome: 0,
            totalInvestmentValue: 0,
            userId: req.user.userId
        });
        await scenario.save();
        res.status(200).json({ message: "Scenario imported successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
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

router.put("/api/users/update", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { username, age } = req.body;

        // validation
        if (!username || typeof age === "undefined") {
            return res.status(400).json({ message: "Username and age are required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user_id,
            {
                username,
                age,
                updatedAt: Date.now(),
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/api/users/activity", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [investments, eventSeries, scenarios] = await Promise.all([
            Investment.find({ userId }).populate("investmentType").sort({ updatedAt: -1 }),
            EventSeries.find({ userId }).sort({ updatedAt: -1 }),
            Scenario.find({ userId }).sort({ updatedAt: -1 }),
        ]);

        // Combine and sort all activities by updatedAt or createdAt
        const allActivity = [
            ...investments.map((item) => ({ type: "Investment", ...item._doc })),
            ...eventSeries.map((item) => ({ type: "EventSeries", ...item._doc })),
            ...scenarios.map((item) => ({ type: "Scenario", ...item._doc })),
        ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

        res.status(200).json(allActivity);
    } catch (error) {
        console.error("Error fetching user activity:", error);
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
            $or: [{ userId: user_id }, { read_write: user_email }],
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
            read_only: user_email,
        });

        res.json(readOnlyScenarios);
    } catch (error) {
        console.error("Error fetching read-only scenarios:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
