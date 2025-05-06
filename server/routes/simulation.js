const express = require("express");
const { Worker } = require("worker_threads");
const path = require("path");
const router = express.Router();
const { runSimulation,scenarioExploration_1D } = require("../simulations/simulate");
const Scenario = require("../models/Scenario");
const User = require("../models/User");

function runWorker(scenario, age, username) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, "../simulations/simulationWorker.js"), {
            workerData: { scenario, age, username },
        });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

router.post("/runSimulation", async (req, res) => {
    const { scenarioId, username, numSimulations } = req.body;

    try {
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                },
            })
            .populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("roth_conversion_strategy")
            .populate("rmd_strategy")
            .populate("sharedUser")
            .lean();

        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found" });
        }

        const user = await User.findOne({ username }).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;
        const financialGoal = scenario.financial_goal;

        const workers = Array.from({ length: numSimulations }, () =>
            runWorker(scenario, age, username)
        );

        const results = await Promise.all(workers);

        // Aggregate results to calculate success probability
        const yearlySuccess = {};
        results.forEach(({ yearlyInvestments }) => {
            yearlyInvestments.forEach(({ year, totalInvestmentValue }) => {
                if (!yearlySuccess[year]) yearlySuccess[year] = { successCount: 0, totalCount: 0 };
                if (totalInvestmentValue >= financialGoal) yearlySuccess[year].successCount++;
                yearlySuccess[year].totalCount++;
            });
        });

        const successProbability = Object.entries(yearlySuccess).map(([year, { successCount, totalCount }]) => ({
            year: parseInt(year, 10),
            probability: (successCount / totalCount) * 100,
        }));

        return res.status(200).json({ message: "Simulations complete", successProbability });
    } catch (error) {
        console.error("Simulation error:", error);
        res.status(500).send("Simulation failed");
    }
});

router.post("/runSimulationWithRanges", async (req, res) => {
    const { scenarioId, username, numSimulations } = req.body;

    try {
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                },
            })
            .populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("roth_conversion_strategy")
            .populate("rmd_strategy")
            .populate("sharedUser")
            .lean();

        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found" });
        }

        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;

        const workers = Array.from({ length: numSimulations }, () =>
            runWorker(scenario, age, username)
        );

        const results = await Promise.all(workers);

        const aggregatedMaps = {
            totalInvestments: {},
            totalIncome: {},
            totalExpenses: {},
            earlyWithdrawalTax: {},
            discretionaryPercentage: {},
        };

        // results.forEach((result, index) => {
        //     console.log("simulation result:", index + 1);
        //     console.log("yearlyInvestments:", JSON.stringify(result.yearlyInvestments, null, 2));
        //     console.log("yearlyData:", JSON.stringify(result.yearlyData, null, 2));
        // });

        results.forEach(({ yearlyInvestments, yearlyData }) => {
            yearlyInvestments.forEach(({ year, totalInvestmentValue }) => {
                if (!aggregatedMaps.totalInvestments[year]) aggregatedMaps.totalInvestments[year] = [];
                aggregatedMaps.totalInvestments[year].push(totalInvestmentValue);
            });

            yearlyData.forEach((data) => {
                const { year, totalIncome, totalExpenses, earlyWithdrawalTax, discretionaryPercentage } = data;

                if (!aggregatedMaps.totalIncome[year]) aggregatedMaps.totalIncome[year] = [];
                if (!aggregatedMaps.totalExpenses[year]) aggregatedMaps.totalExpenses[year] = [];
                if (!aggregatedMaps.earlyWithdrawalTax[year]) aggregatedMaps.earlyWithdrawalTax[year] = [];
                if (!aggregatedMaps.discretionaryPercentage[year]) aggregatedMaps.discretionaryPercentage[year] = [];

                aggregatedMaps.totalIncome[year].push(totalIncome);
                aggregatedMaps.totalExpenses[year].push(totalExpenses);
                aggregatedMaps.earlyWithdrawalTax[year].push(earlyWithdrawalTax);
                aggregatedMaps.discretionaryPercentage[year].push(discretionaryPercentage);
            });
        });

        // Calculate percentiles for the selected quantity
        const calculatePercentiles = (values, percentiles) => {
            values.sort((a, b) => a - b);
            return percentiles.map((p) => values[Math.floor((p / 100) * values.length)]);
        };

        const computeAggregatedData = (dataMap) =>
            Object.entries(dataMap).map(([year, values]) => {
                const percentiles = calculatePercentiles(values, [10, 20, 30, 40, 50, 60, 70, 80, 90]);
                return {
                    year: parseInt(year, 10),
                    median: percentiles[4],
                    ranges: {
                        "10-90": [percentiles[0], percentiles[8]],
                        "20-80": [percentiles[1], percentiles[7]],
                        "30-70": [percentiles[2], percentiles[6]],
                        "40-60": [percentiles[3], percentiles[5]],
                    },
                };
            });

        return res.status(200).json({
            totalInvestments: computeAggregatedData(aggregatedMaps.totalInvestments),
            totalIncome: computeAggregatedData(aggregatedMaps.totalIncome),
            totalExpenses: computeAggregatedData(aggregatedMaps.totalExpenses),
            earlyWithdrawalTax: computeAggregatedData(aggregatedMaps.earlyWithdrawalTax),
            discretionaryExpensePercentage: computeAggregatedData(aggregatedMaps.discretionaryPercentage),
        });

    } catch (error) {
        console.error("Simulation error:", error);
        res.status(500).send("Simulation failed");
    }
});

router.post("/runStackedBarChart", async (req, res) => {
    const { scenarioId, username, numSimulations, selectedQuantity, aggregationThreshold, useMedian } = req.body;

    try {
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                },
            })
            .populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("roth_conversion_strategy")
            .populate("rmd_strategy")
            .populate("sharedUser")
            .lean();

        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found" });
        }

        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;

        const workers = Array.from({ length: numSimulations }, () =>
            runWorker(scenario, age, username)
        );

        const results = await Promise.all(workers);

        // Aggregate results for yearlyBreakdown
        const yearlyBreakdownAggregated = {};
        results.forEach(({ yearlyBreakdown }) => {
            yearlyBreakdown.forEach(({ year, investments, income, expenses }) => {
                if (!yearlyBreakdownAggregated[year]) {
                    yearlyBreakdownAggregated[year] = { investments: {}, income: {}, expenses: {} };
                }

                // Aggregate investments
                investments.forEach(({ investmentType, value }) => {
                    if (!yearlyBreakdownAggregated[year].investments[investmentType]) {
                        yearlyBreakdownAggregated[year].investments[investmentType] = [];
                    }
                    yearlyBreakdownAggregated[year].investments[investmentType].push(value);
                });

                // Aggregate income
                income.forEach(({ eventName, value }) => {
                    if (!yearlyBreakdownAggregated[year].income[eventName]) {
                        yearlyBreakdownAggregated[year].income[eventName] = [];
                    }
                    yearlyBreakdownAggregated[year].income[eventName].push(value);
                });

                // Aggregate expenses
                expenses.forEach(({ eventName, value }) => {
                    if (!yearlyBreakdownAggregated[year].expenses[eventName]) {
                        yearlyBreakdownAggregated[year].expenses[eventName] = [];
                    }
                    yearlyBreakdownAggregated[year].expenses[eventName].push(value);
                });
            });
        });

        // Calculate median or average values
        const calculateStatistic = (values, useMedian) => {
            values.sort((a, b) => a - b);
            if (useMedian) {
                const mid = Math.floor(values.length / 2);
                return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
            } else {
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        };

        const aggregatedData = Object.entries(yearlyBreakdownAggregated).map(([year, breakdown]) => {
            const aggregateCategory = (category) => {
                const aggregated = Object.entries(category).map(([name, values]) => ({
                    name,
                    value: calculateStatistic(values, useMedian),
                }));

                // Apply aggregation threshold
                const filtered = aggregated.filter(({ value }) => value >= aggregationThreshold);
                const otherValue = aggregated
                    .filter(({ value }) => value < aggregationThreshold)
                    .reduce((sum, { value }) => sum + value, 0);

                if (otherValue > 0) {
                    filtered.push({ name: "Other", value: otherValue });
                }

                return filtered;
            };

            return {
                year: parseInt(year, 10),
                investments: aggregateCategory(breakdown.investments),
                income: aggregateCategory(breakdown.income),
                expenses: aggregateCategory(breakdown.expenses),
            };
        });

        return res.status(200).json({ message: "Stacked bar chart data ready", aggregatedData });
    } catch (error) {
        console.error("Error generating stacked bar chart data:", error);
        res.status(500).send("Failed to generate stacked bar chart data");
    }
});

router.post("/run1DSimulations", async (req, res) => { 
    console.log("run1DSimulations...")
    console.log(req.body) 
    //multi line

        //for each param type
            //run sims scenarioExploration_1D(scenario, age, username, numSim, paramType, enableRoth = null, eventName = null, min = null, max = null, stepSize = null) 
            //store in chart arr
            
    //line chart 
        //for each param type
            //run sims 
            //store in chart arr
    try {
        const {
            scenarioId,
            username,
            numSimulations,
            MCParamType_1d,
            MC_enableRoth,
            MC_eventStartParams,
            MC_eventDurationParams,
            MC_initAmt_incomeParams,
            MC_initAmt_expenseParams,
            MC_assetPercentParams,
            LCParamType,
            LC_enableRoth,
            LC_eventStartParams,
            LC_eventDurationParams,
            LC_initAmt_incomeParams,
            LC_initAmt_expenseParams,
            LC_assetPercentParams
        } = req.body;
        const user = await User.findOne({ username }).lean();
        if (!user) return res.status(404).json({ message: "User not found" }); 
        const scenario = await Scenario.findById(scenarioId);
        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        } 
        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;    

        const multilineCharts = [];
        const lineCharts = []; 
        let enableRoth = null;
        let eventName = null;
        let min = null;
        let max = null;
        let stepSize = null;

        //get simulation results
        //multi line
        for (const paramType of MCParamType_1d) {
            // For each paramType, run simulations and store results  
            let paramVar = null;
            enableRoth=null;
            if (paramType === "enableRoth") {
                enableRoth = MC_enableRoth; 
            } else {        //have numeric vars  
                switch (paramType) { 
                    case "eventStart":
                        paramVar = MC_eventStartParams;
                        break;
                    case "eventDuration":
                        paramVar = MC_eventDurationParams;
                        break;
                    case "initAmt_income":
                        paramVar = MC_initAmt_incomeParams;
                        break;
                    case "initAmt_expense":
                        paramVar = MC_initAmt_expenseParams;
                        break;
                    case "assetPercent":
                        paramVar = MC_assetPercentParams;
                        break;
                    default:
                        console.log("Unknown MCParamType_1d: ", paramType)
                }
                console.log("Param ", paramVar)
                eventName = paramVar.obj?.name; 
                min = paramVar.min;
                max = paramVar.max;
                stepSize = paramVar.step
            }                                   
            const simResult = await scenarioExploration_1D(scenario, age, username, numSimulations, paramType, enableRoth, eventName, min, max, stepSize) 
            if (simResult === -1) {
                return res.status(500).json({ error: "Simulation failed." });
            }
            multilineCharts.push(simResult); 
            enableRoth = null;
            eventName = null;    
            min = null; 
            max = null;
            stepSize = null;
        }

        //line chart simulation  
        for (const paramType of LCParamType) {
            enableRoth = null;
            eventName = null;    
            min = null;
            max = null;
            stepSize = null;

            if (paramType === "enableRoth") {   
                enableRoth = LC_enableRoth;
            } else {
                let paramVar = null; 
                switch (paramType) {
                    case "eventStart":
                        paramVar = LC_eventStartParams;
                        break;
                    case "eventDuration":
                        paramVar = LC_eventDurationParams;
                        break;
                    case "initAmt_income":
                        paramVar = LC_initAmt_incomeParams;
                        break;
                    case "initAmt_expense":
                        paramVar = LC_initAmt_expenseParams;
                        break;
                    case "assetPercent":
                        paramVar = LC_assetPercentParams;
                        break;
                    default:
                        console.log("Unknown LCParamType: ", paramType)
                } 
                if (paramVar) {
                    eventName = paramVar.obj?.name || null;
                    min = paramVar.min;
                    max = paramVar.max;
                    stepSize = paramVar.step;
                }
            }

            const lineChartResult = await scenarioExploration_1D(
                scenario,
                age,
                username,
                numSimulations,
                LCParamType,
                enableRoth,
                eventName,
                min,
                max,
                stepSize
            ); 
            if (lineChartResult === -1) {
                return res.status(500).json({ error: "Line chart simulation failed." });
            } 
            lineCharts.push(lineChartResult);  
            console.log("multilineCharts: ", multilineCharts)
            console.log("lineCharts: ",lineCharts)
            return res.status(200).json({
                message: "1D Simulations complete",
                multilineCharts,
                lineCharts 
            });
        }
    } catch (err) {
        console.error("Error in /run1DSimulations:", err);
        res.status(500).json({ error: "Simulation failed." });
    } 
});


router.post("/runAllSimulations", async (req, res) => {
    const { scenarioId, username, numSimulations, stackedChartQuantity, aggregationThreshold, useMedian } = req.body;

    try {
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                },
            })
            .populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("roth_conversion_strategy")
            .populate("rmd_strategy")
            .populate("sharedUser")
            .lean();

        if (!scenario) return res.status(404).json({ message: "Scenario not found" });

        const user = await User.findOne({ username }).lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;
        const financialGoal = scenario.financial_goal;

        const workers = Array.from({ length: numSimulations }, () =>
            runWorker(scenario, age, username)
        );

        const results = await Promise.all(workers);

        // --- 1. SUCCESS PROBABILITY ---
        const yearlySuccess = {};
        results.forEach(({ yearlyInvestments }) => {
            yearlyInvestments.forEach(({ year, totalInvestmentValue }) => {
                if (!yearlySuccess[year]) yearlySuccess[year] = { successCount: 0, totalCount: 0 };
                if (totalInvestmentValue >= financialGoal) yearlySuccess[year].successCount++;
                yearlySuccess[year].totalCount++;
            });
        });
        const successProbability = Object.entries(yearlySuccess).map(([year, { successCount, totalCount }]) => ({
            year: parseInt(year, 10),
            probability: (successCount / totalCount) * 100,
        }));

        // --- 2. SHADED CHART DATA ---
        const aggregatedMaps = {
            totalInvestments: {}, totalIncome: {}, totalExpenses: {},
            earlyWithdrawalTax: {}, discretionaryPercentage: {},
        };

        // results.forEach((result, index) => {
        //     console.log("simulation result:", index + 1);
        //     console.log("yearlyInvestments:", JSON.stringify(result.yearlyInvestments, null, 2));
        //     console.log("yearlyData:", JSON.stringify(result.yearlyData, null, 2));
        // });

        results.forEach(({ yearlyInvestments, yearlyData }) => {
            yearlyInvestments.forEach(({ year, totalInvestmentValue }) => {
                aggregatedMaps.totalInvestments[year] ||= [];
                aggregatedMaps.totalInvestments[year].push(totalInvestmentValue);
            });
            yearlyData.forEach(({ year, totalIncome, totalExpenses, earlyWithdrawalTax, discretionaryPercentage }) => {
                aggregatedMaps.totalIncome[year] ||= [];
                aggregatedMaps.totalExpenses[year] ||= [];
                aggregatedMaps.earlyWithdrawalTax[year] ||= [];
                aggregatedMaps.discretionaryPercentage[year] ||= [];
                aggregatedMaps.totalIncome[year].push(totalIncome);
                aggregatedMaps.totalExpenses[year].push(totalExpenses);
                aggregatedMaps.earlyWithdrawalTax[year].push(earlyWithdrawalTax);
                aggregatedMaps.discretionaryPercentage[year].push(discretionaryPercentage);
            });
        });

        // Calculate percentiles for the selected quantity
        const calculatePercentiles = (values, percentiles) => {
            values.sort((a, b) => a - b);
            return percentiles.map((p) => values[Math.floor((p / 100) * values.length)]);
        };
        const computeAggregatedData = (dataMap) =>
            Object.entries(dataMap).map(([year, values]) => {
                const percentiles = calculatePercentiles(values, [10, 20, 30, 40, 50, 60, 70, 80, 90]);
                return {
                    year: parseInt(year, 10),
                    median: percentiles[4],
                    ranges: {
                        "10-90": [percentiles[0], percentiles[8]],
                        "20-80": [percentiles[1], percentiles[7]],
                        "30-70": [percentiles[2], percentiles[6]],
                        "40-60": [percentiles[3], percentiles[5]],
                    },
                };
            });

        const shadedChartData = {
            totalInvestments: computeAggregatedData(aggregatedMaps.totalInvestments),
            totalIncome: computeAggregatedData(aggregatedMaps.totalIncome),
            totalExpenses: computeAggregatedData(aggregatedMaps.totalExpenses),
            earlyWithdrawalTax: computeAggregatedData(aggregatedMaps.earlyWithdrawalTax),
            discretionaryExpensePercentage: computeAggregatedData(aggregatedMaps.discretionaryPercentage),
        };

        // --- 3. STACKED BAR CHART ---
        const yearlyBreakdownAggregated = {};
        results.forEach(({ yearlyBreakdown }) => {
            yearlyBreakdown.forEach(({ year, investments, income, expenses }) => {
                yearlyBreakdownAggregated[year] ||= { investments: {}, income: {}, expenses: {} };

                // Aggregate investments
                investments.forEach(({ investmentType, value }) => {
                    yearlyBreakdownAggregated[year].investments[investmentType] ||= [];
                    yearlyBreakdownAggregated[year].investments[investmentType].push(value);
                });

                // Aggregate income
                income.forEach(({ eventName, value }) => {
                    yearlyBreakdownAggregated[year].income[eventName] ||= [];
                    yearlyBreakdownAggregated[year].income[eventName].push(value);
                });

                // Aggregate expenses
                expenses.forEach(({ eventName, value }) => {
                    yearlyBreakdownAggregated[year].expenses[eventName] ||= [];
                    yearlyBreakdownAggregated[year].expenses[eventName].push(value);
                });
            });
        });

        // Calculate median or average values
        const calculateStatistic = (values, useMedian) => {
            values.sort((a, b) => a - b);
            return useMedian
                ? (values.length % 2 !== 0
                    ? values[Math.floor(values.length / 2)]
                    : (values[values.length / 2 - 1] + values[values.length / 2]) / 2)
                : values.reduce((sum, val) => sum + val, 0) / values.length;
        };

        const aggregatedData = Object.entries(yearlyBreakdownAggregated).map(([year, breakdown]) => {
            const aggregateCategory = (category) => {
                const aggregated = Object.entries(category).map(([name, values]) => ({
                    name,
                    value: calculateStatistic(values, useMedian),
                }));

                // Apply aggregation threshold
                const filtered = aggregated.filter(({ value }) => value >= aggregationThreshold);
                const otherValue = aggregated
                    .filter(({ value }) => value < aggregationThreshold)
                    .reduce((sum, { value }) => sum + value, 0);

                if (otherValue > 0) {
                    filtered.push({ name: "Other", value: otherValue });
                }

                return filtered;
            };

            return {
                year: parseInt(year, 10),
                investments: aggregateCategory(breakdown.investments),
                income: aggregateCategory(breakdown.income),
                expenses: aggregateCategory(breakdown.expenses),
            };
        });

        return res.status(200).json({
            message: "Simulations complete",
            successProbability,
            shadedChartData,
            stackedChartData: aggregatedData,
        });

    } catch (error) {
        console.error("Simulation error:", error);
        res.status(500).send("Simulation failed");
    }
});

module.exports = router;
