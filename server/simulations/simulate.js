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
    checkLifeExpectancy
} = require("./algorithms");

async function runSimulation(scenario, age, username) {
    const currentDatetime = new Date().toISOString().replace(/[:.]/g, "-");
    const logFolder = path.join(__dirname, "../../logs");
    const csvFile = path.join(logFolder, `${usenamer}_${currentDatetime}.csv`);
    const logFile = path.join(logFolder, `${username}_${currentDatetime}.log`);

    if (!fs.existsSync(logFolder)) {
        fs.mkdirSync(logFolder, { recursive: true });
    }

    const csvStream = fs.createWriteStream(csvFile);
    const logStream = fs.createWriteStream(logFile);

    // Write CSV header
    csvStream.write("Year," + scenario.investments.map(inv => inv.investmentType.name).join(",") + "\n");

    logStream.write(`Simulation log for user: ${username}\n`);
    logStream.write(`Start time: ${new Date().toISOString()}\n\n`);

    // Step 0: Initialize random scenario/ event parameters
    setScenarioLifeExpectancy(scenario);
    scenario.event_series.forEach((event) => {
        setEventParams(event, scenario);
    });

    const currentYear = new Date().getFullYear();
    const endYear = Math.max(
        scenario.birth_year + scenario.life_expectancy,
        scenario.birth_year_spouse + scenario.life_expectancy_spouse
    );

    for (let year = currentYear; year <= endYear; year++) {
        logStream.write(`Year: ${year}\n`);

        // Check life expectancy
        const lifeStatus = await checkLifeExpectancy(scenario, year);
        logStream.write(`Life status: User - ${lifeStatus.user}, Spouse - ${lifeStatus.spouse}\n`);
        if (lifeStatus.user === "dead" && lifeStatus.spouse === "dead") {
            logStream.write("Both user and spouse are deceased. Ending simulation.\n");
            break;
        }

        // Step 1: Run income events
        const income = runIncomeEvents(scenario, year);
        logStream.write(`Income: ${income}\n`);

        // Step 2: Perform RMD for the previous year
        if (year > currentYear) {
            for (const investment of scenario.investments) {
                if (investment.tax_status === "pre-tax retirement") {
                    const rmd = await performRMD(scenario, investment, age, year - 1);
                    logStream.write(`RMD: ${rmd} from ${investment.investmentType.name}\n`);
                }
            }
        }

        // Step 5: Update investment values
        updateInvestments(scenario);
        logStream.write("Updated investment values.\n");

        // Step 6: Run Roth conversion optimizer
        if (scenario.roth_conversion_enabled) {
            runRothConversion(scenario, year);
            logStream.write("Performed Roth conversion.\n");
        }

        // Step 7: Pay non-discretionary expenses and previous year's taxes
        pay_nonDiscretionaryTaxes(scenario, username, year);
        logStream.write("Paid non-discretionary expenses and taxes.\n");

        // Step 8: Pay discretionary expenses if possible
        const discretionaryResult = pay_discretionary(scenario, username, year);
        if (discretionaryResult === -1) {
            logStream.write("Financial goal violated while paying discretionary expenses.\n");
        } else {
            logStream.write("Paid discretionary expenses.\n");
        }

        // Step 9: Run scheduled invest events
        const investEvents = scenario.event_series.filter(
            (event) => event.eventType === "Invest" && event.startYear === year
        );
        runScheduled_investEvent(investEvents, scenario);
        logStream.write("Ran scheduled invest events.\n");

        // Step 10: Run rebalance events
        const rebalanceEvents = scenario.event_series.filter(
            (event) => event.eventType === "Rebalance" && event.startYear === year
        );
        rebalanceEvents.forEach((rebalanceEvent) => {
            rebalanceInvestments(scenario, rebalanceEvent);
            logStream.write(`Rebalanced investments: ${JSON.stringify(rebalanceEvent)}\n`);
        });

        // Write investment values to CSV
        const investmentValues = scenario.investments.map(inv => inv.value.toFixed(2)).join(",");
        csvStream.write(`${year},${investmentValues}\n`);

        // Handle life expectancy and marital status changes
        if (lifeStatus.user === "dead") {
            scenario.user_alive = false;
            scenario.marital_status = "single";
        }
        if (lifeStatus.spouse === "dead") {
            scenario.spouse_alive = false;
            scenario.marital_status = "single";
        }

        logStream.write("\n");
    }

    csvStream.end();
    logStream.end();
}

module.exports = { runSimulation };
