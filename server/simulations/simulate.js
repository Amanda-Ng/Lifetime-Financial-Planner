// TP: Generated with Copilot: Prompt: "using the algorithms and the correctly implemented flow from the simulation create a funciton to run the algorithms in the correct order."
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

async function runSimulation(scenario, age) {
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
        // Check life expectancy
        const lifeStatus = await checkLifeExpectancy(scenario, year);
        if (lifeStatus.user === "dead" && lifeStatus.spouse === "dead") {
            console.log(`Simulation ends in year ${year} as both user and spouse are deceased.`);
            break;
        }

        // Step 1: Run income events
        runIncomeEvents(scenario, year);

        // Step 2: Perform RMD for the previous year
        if (year > currentYear) {
            scenario.investments.forEach(async (investment) => {
                if (investment.tax_status === "pre-tax retirement") {
                    await performRMD(scenario, investment, age, year - 1);
                }
            });
        }

        // Step 5: Update investment values
        updateInvestments(scenario);

        // Step 6: Run Roth conversion optimizer
        if (scenario.roth_conversion_enabled) {
            runRothConversion(scenario, year);
        }

        // Step 7: Pay non-discretionary expenses and previous year's taxes
        pay_nonDiscretionaryTaxes(scenario, scenario.user, year);

        // Step 8: Pay discretionary expenses if possible
        if (pay_discretionary(scenario, scenario.user, year) === -1) {
            console.warn(`Financial goal violated in year ${year}`);
        }

        // Step 9: Run scheduled invest events
        const investEvents = scenario.event_series.filter(
            (event) => event.eventType === "Invest" && event.startYear === year
        );
        runScheduled_investEvent(investEvents, scenario);

        // Step 10: Run rebalance events
        const rebalanceEvents = scenario.event_series.filter(
            (event) => event.eventType === "Rebalance" && event.startYear === year
        );
        rebalanceEvents.forEach((rebalanceEvent) => {
            rebalanceInvestments(scenario, rebalanceEvent);
        });

        // Handle life expectancy and marital status changes
        if (lifeStatus.user === "dead") {
            scenario.user_alive = false;
            scenario.marital_status = "single";
        }
        if (lifeStatus.spouse === "dead") {
            scenario.spouse_alive = false;
            scenario.marital_status = "single";
        }
    }
}

module.exports = { runSimulation };
