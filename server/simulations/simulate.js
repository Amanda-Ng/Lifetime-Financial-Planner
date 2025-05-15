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
    updateEventsExpectedChange,
    updateInvestments,
    runRothConversion,
    pay_nonDiscretionaryTaxes,
    pay_discretionary,
    runScheduled_investEvent,
    rebalanceInvestments,
    setInflationRates,
    inflationAdjusted,
    setScenarioLifeExpectancy,
    setEventParams,
    checkLifeExpectancy,
    getExpenses_byYear,
    resetEarlyWithdrawalTax,
    getEarlyWithdrawalTax,
    calculateFederalTaxes,
    calculateTotalInvestmentValue
} = require("./algorithms");

// let testScenario = Scenario.findOne({ name: "Test Simulation" })
//     .populate({
//         path: "investments", // Populate investments
//         populate: {
//             path: "investmentType", // Populate investmentType within investments
//         },
//     })
//     .populate("event_series") // Populate event series
//     .populate("spending_strategy") // Populate spending strategy
//     .populate("expense_withdrawal_strategy") // Populate expense withdrawal strategy
//     .populate("roth_conversion_strategy") // Populate Roth conversion strategy
//     .populate("rmd_strategy") // Populate RMD strategy
//     .populate("sharedUser") // Populate shared users
//     .then((scenario) => {
//         if (!scenario) {
//             console.error("Scenario not found in the database.");
//             return null;
//         } else {
//             console.log("Scenario found. Starting simulation...");
//             runSimulation(scenario, 30, "testUser");
//         }
//     })
//     .catch((err) => {
//         console.error("Error finding scenario:", err);
//     });

async function runSimulation(scenario, age, username, seed) {
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
    setScenarioLifeExpectancy(scenario, currentYear, seed);
    scenario.event_series.forEach((event) => {
        setEventParams(event, seed);
    });
    scenario.investments.forEach((investment) => {
        investment.initialValue = investment.value
    })
    setInflationRates(scenario);

    const yearlyInvestments = [];
    const yearlyData = [];
    const yearlyBreakdown = [];

    const personEndYear = scenario.birth_year && scenario.life_expectancy
        ? scenario.birth_year + scenario.life_expectancy
        : 0;
    const spouseEndYear = scenario.birth_year_spouse && scenario.life_expectancy_spouse
        ? scenario.birth_year_spouse + scenario.life_expectancy_spouse
        : 0;
    const endYear = Math.max(personEndYear, spouseEndYear);

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


        // Step 0.5: Update expected change for events
        console.log("Updating expected change for events...");
        updateEventsExpectedChange(scenario, seed);


        // Step 1: Run income events
        console.log("Running income events...");
        const income = runIncomeEvents(scenario, year, seed);
        logStream.write(`Income: ${income}\n`);

        // Step 2: Perform RMD for the previous year
        if (year > currentYear) {
            console.log("Performing RMD for the previous year...");
            let totalPreTaxRetirementValue = 0;
            for (const investment of scenario.investments) {
                if (investment.tax_status === "pre-tax retirement") {
                    totalPreTaxRetirementValue += investment.value;
                }
            }

            const rmd = await performRMD(scenario, totalPreTaxRetirementValue, age, year - 1);
            logStream.write(`RMD: ${rmd} from total pre-tax retirement value ${totalPreTaxRetirementValue} \n`);
        }

        // Step 5: Update investment values
        console.log("Updating investment values...");
        updateInvestments(scenario, seed);
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
            (event) => event.eventType === "invest" && event.startYear === year
        );
        runScheduled_investEvent(investEvents, scenario, year);
        logStream.write("Ran scheduled invest events.\n");

        // Step 10: Run rebalance events
        console.log("Running rebalance events...");
        const rebalanceEvents = scenario.event_series.filter(
            (event) => event.eventType === "rebalance" && event.startYear === year
        );
        rebalanceEvents.forEach((rebalanceEvent) => {
            rebalanceInvestments(scenario, rebalanceEvent);
            logStream.write(`Rebalanced investments: ${JSON.stringify(rebalanceEvent)}\n`);
        });

        // Used for line chart of probability of success
        const totalInvestmentValue = calculateTotalInvestmentValue(scenario.investments);
        yearlyInvestments.push({ year, totalInvestmentValue });

        // Used for shaded line chart
        const totalExpenses = getExpenses_byYear(scenario, year).reduce((sum, exp) => {
            const yearsElapsed = year - exp.startYear;
            const effectiveAmount = exp.initialAmount + (exp.expectedChange || 0) * yearsElapsed;
            return sum + effectiveAmount;
        }, 0);

        const earlyWithdrawalTax = getEarlyWithdrawalTax();

        const discretionaryExpenses = getExpenses_byYear(scenario, year).filter(exp => exp.isDiscretionary);
        const totalInitial = discretionaryExpenses.reduce((sum, exp) => {
            const yearsElapsed = year - exp.startYear;
            const effectiveAmount = exp.initialAmount + (exp.expectedChange || 0) * yearsElapsed;
            return sum + effectiveAmount;
        }, 0);
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
            .filter((event) => event.eventType === "income" && year >= event.startYear && year < event.startYear + event.duration)
            .map((event) => {
                const yearsElapsed = year - event.startYear;
                const baseAmount = event.initialAmount + yearsElapsed * (event.expectedChange ?? 0);
                const inflationAdjustedAmount = inflationAdjusted(baseAmount, scenario.inflation[year]);
                return {
                    eventName: event.name,
                    value: inflationAdjustedAmount,
                };
            });

        const expenseBreakdown = scenario.event_series
            .filter((event) => event.eventType === "expense" && year >= event.startYear && year < event.startYear + event.duration)
            .map((event) => {
                const yearsElapsed = year - event.startYear;
                const adjustedAmount = event.initialAmount + yearsElapsed * (event.expectedChange ?? 0);
                return {
                    eventName: event.name,
                    value: adjustedAmount,
                };
            });

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

function values_byStep(min, max, step) {
    const values = [];
    for (let i = min; i <= max; i += step) {
        values.push(i);
    }
    return values;
}

//modifies the specified parameter in scenario
//returns -1 for failure, 0 for success
async function modifyScenario(paramType, scenario, value, eventName) {
    //find event
    const event = scenario.event_series.find(event => event.name === eventName)
    if (!event) {
        console.log("event not found: ", eventName)
        console.log("scenario ", scenario)
    }
    //change event value and set ty[e to fixed]
    switch (paramType) {
        case "eventStart":
            event.startYearType = "fixed"
            event.startYear = value;
            break;

        case "eventDuration":
            event.durationType = "fixed"
            event.duration = value;
            break;

        case "initAmt_income":
            event.initialAmount = value;
            break;

        case "initAmt_expense":
            event.initialAmount = value;
            break;

        case "assetPercent":
            const asset2Percent = 1 - value
            let assets = event.assetAllocationType === "fixed"
                ? event.fixedAllocation
                : event.initialAllocation;
            event.assetAllocationType = "fixed";
            const userInvests = await Investment.find({ userId: scenario.userId });
            // get indices for both assets (non null percents)
            const indices = assets.reduce((arr, val, idx) => {
                if (val !== null) arr.push(idx);
                return arr;
            }, []);
            assets[indices[0]] = value;
            assets[indices[1]] = asset2Percent;
            break;

        default:
            console.log("modifyScenario: Unknown event " + eventName);
            return -1;
    }
    return 0;

}

//return a deep copy of scenario 
//only events are populated 
function cloneScenario(scenario) {
    let clone = scenario.toObject({ depopulate: true, getters: false });
    clone = JSON.parse(JSON.stringify(clone));
    const originalEvents = scenario.event_series || [];
    //clone events
    const clonedEvents = [];
    for (const e of originalEvents) {
        let newEvent;
        if (e.toObject) {
            newEvent = JSON.parse(JSON.stringify(e.toObject()));
        } else {
            newEvent = JSON.parse(JSON.stringify(e));
        }
        clonedEvents.push(newEvent);
    }
    clone.event_series = clonedEvents;
    // Clone investments
    const originalInvestments = scenario.investments || [];
    const clonedInvestments = [];
    for (const investment of originalInvestments) {
        let newInvestment = JSON.parse(JSON.stringify(investment)); // Clone the investment object

        // Clone the investmentType associated with the investment
        if (investment.investmentType) {
            let newInvestmentType = JSON.parse(JSON.stringify(investment.investmentType)); // Deep copy investmentType
            delete newInvestmentType._id;  // Remove _id if not needed
            newInvestment.investmentType = newInvestmentType;  // Assign the cloned investmentType to the investment
        }

        // Push the cloned investment to the clonedInvestments array
        clonedInvestments.push(newInvestment);
    }
    clone.investments = clonedInvestments;
    console.log("original:  ", scenario)
    console.log("cloned:  ", clone)
    return clone
}

//numSim: number of simulations to run for each value  
//paramType: enableRoth , eventStart, eventDuration, initAmt_income, initAmt_expense?, assetPercent
//for assetPercent: frontend should restrict options to only allow events with 2 assets 
//values: arr of values for the parameter
//return -1 for invalid parameters(e.g enableRoth when the scenario doesn't consider it) 
async function scenarioExploration_1D(scenario, age, username, numSim, paramType, enableRoth = null, eventName = null, min = null, max = null, stepSize = null) {
    seed = Math.random;
    scenario = await Scenario.findById(scenario._id)
        .populate('event_series')  // needed to clone 
        .populate({
            path: 'investments',
            populate: {
                path: 'investmentType'
            }
        })
        .exec();
    const simSets = []; //index i correspond to the set of sims ran for value[i]
    if (paramType === "enableRoth") {
        if (!scenario.roth_conversion_optimizer_settings[0]) {
            console.log("Enabling roth conversion failed.");
            return -1;
        }
        //run with roth optimizer on or off 
        const scenarioCopy = cloneScenario(scenario)
        if (enableRoth == false) {
            scenarioCopy.roth_conversion_optimizer_settings[0] = 0
        }
        const simSet = [];
        for (let i = 0; i < numSim; i++) {
            simSet.push(await runSimulation(scenario, age, username, seed));
        }
        simSets.push(simSet);
        return simSets
    }
    //other options should be numeric
    if (eventName == null || min == null || max == null || stepSize == null) {
        console.log(paramType + " has null numeric parameters or event.")
        return -1;
    }
    const values = values_byStep(min, max, stepSize)
    //for each value, run simulation numSim times 
    for (const value of values) {
        //modify value in scenario
        const scenarioCopy = cloneScenario(scenario)
        if (modifyScenario(paramType, scenarioCopy, value, eventName) == -1) {
            return -1
        }
        const simSet = [];
        for (let i = 0; i < numSim; i++) {
            simSet.push(await runSimulation(scenario, age, username, seed));
        }
        simSets.push(simSet);
    }
    console.log("scenarioExploration_1D done ", simSets)
    return simSets
}

// Two-dimensional scenario exploration
async function scenarioExploration_2D(
    scenario,
    age,
    username,
    numSim,
    param1,
    param2,
    event1Name,
    event2Name,
    min1,
    max1,
    step1,
    min2,
    max2,
    step2
) {
    const values1 = values_byStep(min1, max1, step1);
    const values2 = values_byStep(min2, max2, step2);

    scenario = await Scenario.findById(scenario._id)
        .populate('event_series')
        .populate({
            path: 'investments',
            populate: { path: 'investmentType' }
        })
        .exec();

    const resultsGrid = [];

    for (const val1 of values1) {
        const rowResults = [];
        for (const val2 of values2) {
            const scenarioCopy = cloneScenario(scenario);

            const mod1 = await modifyScenario(param1, scenarioCopy, val1, event1Name);
            const mod2 = await modifyScenario(param2, scenarioCopy, val2, event2Name);

            if (mod1 === -1 || mod2 === -1) {
                console.log(`Error modifying scenario for (${val1}, ${val2})`);
                rowResults.push(null); // Placeholder for failure
                continue;
            }

            const simSet = [];
            const seed = Math.random; // Re-seed PRNG per cell
            for (let i = 0; i < numSim; i++) {
                simSet.push(await runSimulation(scenarioCopy, age, username, seed));
            }

            rowResults.push(simSet);
        }
        resultsGrid.push(rowResults);
    }

    return {
        param1_values: values1,
        param2_values: values2,
        simulations: resultsGrid // 2D array: [param1][param2]
    };
}

module.exports = { runSimulation, scenarioExploration_1D };
