// Test imports
const configs = require("../configs/config.js");
const mongoose = require("mongoose");
mongoose.connect(configs.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));
db.once("open", () => console.log("Connected to MongoDB"));

// Register schemas
const Scenario = require("../models/Scenario");
const Investment = require("../models/Investment");
const EventSeries = require("../models/EventSeries");
const RMD = require("../models/RMD");
const FederalTaxes = require("../models/FederalTaxes");
const InvestmentType = require("../models/InvestmentType");
const User = require("../models/User");

// TP: Generated with Copilot: Prompt: "using the algorithms and the correctly implemented flow from the simulation create a funciton to run the algorithms in the correct order."
const fs = require("fs");
const path = require("path");
const {
    runIncomeEvents,
    performRMD,
    updateInvestments,
    runRothConversion,
    pay_nonDiscretionaryTaxes,
    pay_discretionary,
    runScheduled_investEvent,
    rebalanceInvestments,
    setScenarioLifeExpectancy,
    setEventParams,
    checkLifeExpectancy,
    getExpenses_byYear,
    resetEarlyWithdrawalTax,
    getEarlyWithdrawalTax,
    calculateFederalTaxes
} = require("./algorithms");

let testScenario = Scenario.findOne({ name: "Test Simulation" })
    .populate({
        path: "investments", // Populate investments
        populate: {
            path: "investmentType", // Populate investmentType within investments
        },
    })
    .populate("event_series") // Populate event series
    .populate("spending_strategy") // Populate spending strategy
    .populate("expense_withdrawal_strategy") // Populate expense withdrawal strategy
    .populate("roth_conversion_strategy") // Populate Roth conversion strategy
    .populate("rmd_strategy") // Populate RMD strategy
    .populate("sharedUser") // Populate shared users
    .then((scenario) => {
        if (!scenario) {
            console.error("Scenario not found in the database.");
            return null;
        } else {
            console.log("Scenario found. Starting simulation...");
            runSimulation(scenario, 30, "testUser");
        }
    })
    .catch((err) => {
        console.error("Error finding scenario:", err);
    });

async function runSimulation(scenario, age, username) {
    console.log("Simulation started.");

    const currentDatetime = new Date().toISOString().replace(/[:.]/g, "-");
    const logFolder = path.join(__dirname, "../../logs");
    const csvFile = path.join(logFolder, `${username}_${currentDatetime}.csv`);
    const logFile = path.join(logFolder, `${username}_${currentDatetime}.log`);

    if (!fs.existsSync(logFolder)) {
        fs.mkdirSync(logFolder, { recursive: true });
    }

    const csvStream = fs.createWriteStream(csvFile);
    const logStream = fs.createWriteStream(logFile);

    // Write CSV header
    console.log("Writing CSV header...");
    csvStream.write("Year," + scenario.investments.map(inv => inv.investmentType.name).join(",") + "\n");

    logStream.write(`Simulation log for user: ${username}\n`);
    logStream.write(`Start time: ${new Date().toISOString()}\n\n`);

    // Log initial investment values
    console.log("[DEBUG] Initial Investments:");
    scenario.investments.forEach((investment) => {
        console.log(`[DEBUG] Investment: Type=${investment.investmentType.name}, Value=${investment.value}`);
    });

    // Step 0: Initialize random scenario/ event parameters
    const currentYear = new Date().getFullYear();
    
    console.log("Initializing scenario parameters...");
    setScenarioLifeExpectancy(scenario, currentYear);
    scenario.event_series.forEach((event) => {
        setEventParams(event, scenario);
    });

    const yearlyInvestments = [];
    const yearlyData = [];
    const yearlyBreakdown = [];

    const endYear = Math.max(
        scenario.birth_year + scenario.life_expectancy,
        scenario.birth_year_spouse + scenario.life_expectancy_spouse
    );

    console.log(`Simulation will run from ${currentYear} to ${endYear}.`);
    logStream.write(`Simulation will run from ${currentYear} to ${endYear}.\n`);

    for (let year = currentYear; year <= endYear; year++) {
        console.log(`Processing year: ${year}`);
        logStream.write(`Year: ${year}\n`);
        resetEarlyWithdrawalTax();

        // Check life expectancy
        const lifeStatus = await checkLifeExpectancy(scenario, year);
        console.log(`Life status: User - ${lifeStatus.user}, Spouse - ${lifeStatus.spouse}`);
        logStream.write(`Life status: User - ${lifeStatus.user}, Spouse - ${lifeStatus.spouse}\n`);
        if (lifeStatus.user === "dead" && lifeStatus.spouse === "dead") {
            console.log("Both user and spouse are deceased. Ending simulation.");
            logStream.write("Both user and spouse are deceased. Ending simulation.\n");
            break;
        }

        // Step 1: Run income events
        console.log("Running income events...");
        const income = runIncomeEvents(scenario, year);
        logStream.write(`Income: ${income}\n`);

        // Step 2: Perform RMD for the previous year
        if (year > currentYear) {
            console.log("Performing RMD for the previous year...");
            for (const investment of scenario.investments) {
                if (investment.tax_status === "pre-tax retirement") {
                    const rmd = await performRMD(scenario, investment, age, year - 1);
                    logStream.write(`RMD: ${rmd} from ${investment.investmentType.name}\n`);
                }
            }
        }

        // Step 5: Update investment values
        console.log("Updating investment values...");
        updateInvestments(scenario);
        logStream.write("Updated investment values.\n");

        // Step 6: Run Roth conversion optimizer
        if (scenario.roth_conversion_enabled) {
            console.log("Running Roth conversion optimizer...");
            runRothConversion(scenario, year);
            logStream.write("Performed Roth conversion.\n");
        }

        // Step 7: Pay non-discretionary expenses and previous year's taxes
        console.log("Paying non-discretionary expenses and taxes...");
        pay_nonDiscretionaryTaxes(scenario, year);
        logStream.write("Paid non-discretionary expenses and taxes.\n");

        // Step 8: Pay discretionary expenses if possible
        console.log("Paying discretionary expenses...");
        const discretionaryResult = pay_discretionary(scenario, username, year);
        if (discretionaryResult === -1) {
            console.warn(`Financial goal violated while paying discretionary expenses in year ${year}.`);
            logStream.write("Financial goal violated while paying discretionary expenses.\n");
        } else {
            logStream.write("Paid discretionary expenses.\n");
        }

        // Step 9: Run scheduled invest events
        console.log("Running scheduled invest events...");
        const investEvents = scenario.event_series.filter(
            (event) => event.eventType === "Invest" && event.startYear === year
        );
        runScheduled_investEvent(investEvents, scenario, year);
        logStream.write("Ran scheduled invest events.\n");

        // Step 10: Run rebalance events
        console.log("Running rebalance events...");
        const rebalanceEvents = scenario.event_series.filter(
            (event) => event.eventType === "Rebalance" && event.startYear === year
        );
        rebalanceEvents.forEach((rebalanceEvent) => {
            rebalanceInvestments(scenario, rebalanceEvent);
            logStream.write(`Rebalanced investments: ${JSON.stringify(rebalanceEvent)}\n`);
        });

        // Used for line chart of probability of success
        const totalInvestmentValue = scenario.investments.reduce((sum, inv) => sum + Number(inv.value), 0);
        yearlyInvestments.push({ year, totalInvestmentValue: Number.isFinite(totalInvestmentValue) ? totalInvestmentValue : 0 });

        // Used for shaded line chart
        const totalExpenses = getExpenses_byYear(scenario, year).reduce((sum, exp) => sum + exp.initialAmount, 0);

        const earlyWithdrawalTax = getEarlyWithdrawalTax();

        const discretionaryExpenses = getExpenses_byYear(scenario, year).filter(exp => exp.isDiscretionary);
        const totalInitial = discretionaryExpenses.reduce((sum, exp) => sum + exp.initialAmount, 0);
        const discretionaryPercentage = totalInitial
            ? (discretionaryResult / totalInitial) * 100
            : 0;

        yearlyData.push({
            year,
            totalIncome: income,
            totalExpenses,
            earlyWithdrawalTax,
            discretionaryPercentage,
        });

        // Used for stacked bar chart
        const federalTaxes = await calculateFederalTaxes(scenario, year);

        const investmentBreakdown = scenario.investments.map((inv) => ({
            investmentType: inv.investmentType.name,
            value: inv.value,
        }));

        const incomeBreakdown = scenario.event_series
            .filter((event) => event.eventType === "income")
            .map((event) => ({
                eventName: event.name,
                value: inflationAdjusted(event.initialAmount, scenario.inflation_assumption, year - event.startYear),
            }));

        const expenseBreakdown = scenario.event_series
            .filter((event) => event.eventType === "expense")
            .map((event) => ({
                eventName: expense.name,
                value: expense.initialAmount,
            }));

        expenseBreakdown.push({ eventName: "Taxes", value: federalTaxes });

        yearlyBreakdown.push({
            year,
            investments: investmentBreakdown,
            income: incomeBreakdown,
            expenses: expenseBreakdown,
        });

        // Write investment values to CSV
        console.log("Writing investment values to CSV...");
        const investmentValues = scenario.investments.map(inv => Number(inv.value).toFixed(2)).join(",");
        csvStream.write(`${year},${investmentValues}\n`);

        // Handle life expectancy and marital status changes
        if (lifeStatus.user === "dead") {
            console.log("User has passed away. Updating marital status to single.");
            scenario.user_alive = false;
            scenario.marital_status = "single";
        }
        if (lifeStatus.spouse === "dead") {
            console.log("Spouse has passed away. Updating marital status to single.");
            scenario.spouse_alive = false;
            scenario.marital_status = "single";
        }

        logStream.write("\n");
    }

    console.log("Simulation completed.");
    csvStream.end();
    logStream.end();
    return { yearlyInvestments, yearlyData, yearlyBreakdown };
}

module.exports = { runSimulation };
