const express = require("express");
const { Worker } = require("worker_threads");
const path = require("path");
const router = express.Router();
const { runSimulation } = require("../simulations/simulate");
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
