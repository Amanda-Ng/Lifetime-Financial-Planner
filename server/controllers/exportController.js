const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const Scenario = require("../models/Scenario");
const Investment = require("../models/Investment");
const InvestmentType = require("../models/InvestmentType");
const EventSeries = require("../models/EventSeries");

exports.exportScenarioToYAML = async (req, res) => {
    try {
        const scenarioId = req.params.id;
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                    model: "InvestmentType"
                }
            }).populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("rmd_strategy")
            .populate("roth_conversion_strategy");

        if (!scenario) {
            return res.status(404).json({ error: "Scenario not found" });
        }

        const user_id = req.user.userId;
        const userInvestments = await Investment.find({ userId: user_id }).populate("investmentType");

        // Extract unique investment types from the populated investments
        const investmentTypesSet = new Map();
        scenario.investments.forEach(inv => {
            const it = inv.investmentType;
            if (it && !investmentTypesSet.has(it._id.toString())) {
                investmentTypesSet.set(it._id.toString(), it);
            }
        });

        const investmentTypes = Array.from(investmentTypesSet.values()).map(it => {
            const returnDist = it.expected_annual_return_mean && it.expected_annual_return_stdev
                ? {
                    type: "normal",
                    mean: parseFloat(it.expected_annual_return_mean.toString()),
                    stdev: parseFloat(it.expected_annual_return_stdev.toString()),
                }
                : {
                    type: "fixed",
                    value: parseFloat(it.expected_annual_return?.toString() ?? 0),
                };

            const incomeDist = it.expected_annual_income_mean && it.expected_annual_income_stdev
                ? {
                    type: "normal",
                    mean: parseFloat(it.expected_annual_income_mean.toString()),
                    stdev: parseFloat(it.expected_annual_income_stdev.toString()),
                }
                : {
                    type: "fixed",
                    value: parseFloat(it.expected_annual_income?.toString() ?? 0),
                };

            return {
                name: it.name,
                description: it.description ?? "",
                returnAmtOrPct: it.returnType?.includes("Percent") ? "percent" : "amount",
                returnDistribution: returnDist,
                expenseRatio: parseFloat(it.expense_ratio.toString()),
                incomeAmtOrPct: it.incomeType?.includes("Percent") ? "percent" : "amount",
                incomeDistribution: incomeDist,
                taxability: it.taxability === "taxable",
            };
        });

        // Format Investments
        const investments = scenario.investments.map(inv => ({
            investmentType: inv.investmentType.name,
            value: parseFloat(inv.value.toString()),
            taxStatus: inv.tax_status,
            id: inv._id.toString()
        }));

        // Format Event Series
        const buildEventSeriesYaml = (eventSeriesList, userInvestments) => {
            // Build a map from investment index to name
            const investmentIdToName = (inv) => inv.investmentType?.name || "Unnamed Investment";

            const mapDistribution = (type, obj) => {
                if (type.includes("fixed")) {
                    return { type: "fixed", value: obj };
                } else if (type.includes("normal") || type.includes("random")) {
                    return { type: "normal", mean: obj.mean, stdev: obj.std };
                } else if (type.includes("uniform")) {
                    return { type: "uniform", lower: obj.min, upper: obj.max };
                } else if (type.includes("sameAsAnotherEvent")) {
                    return { type: "startWith", eventSeries: obj.anotherEventSeries };
                } else if (type.includes("yearAfterAnotherEvent")) {
                    return { type: "startAfter", eventSeries: obj.anotherEventSeries };
                } else {
                    return { type: "fixed", value: 0 };
                }
            };

            const buildAllocationMap = (allocationArray) => {
                const result = {};
                for (let i = 0; i < allocationArray.length; i++) {
                    const name = investmentIdToName(userInvestments[i]);
                    result[name] = parseFloat(allocationArray[i] || 0);
                }
                return result;
            };

            return eventSeriesList.map((e) => {
                const base = {
                    name: e.name,
                    start: mapDistribution(e.startYearType, {
                        value: e.startYear,
                        mean: e.meanStartYear,
                        std: e.stdDevStartYear,
                        min: e.minStartYear,
                        max: e.maxStartYear,
                        anotherEventSeries: e.anotherEventSeries,
                    }),
                    duration: mapDistribution(e.durationType, {
                        value: e.duration,
                        mean: e.meanDuration,
                        std: e.stdDevDuration,
                        min: e.minDuration,
                        max: e.maxDuration,
                    }),
                    type: e.eventType,
                };

                if (e.eventType === "income" || e.eventType === "expense") {
                    base.initialAmount = e.initialAmount;
                    base.changeAmtOrPct = e.expectedChangeType.includes("amount") ? "amount" : "percent";
                    base.changeDistribution = mapDistribution(e.expectedChangeType, {
                        value: e.expectedChange,
                        mean: e.expectedChangeMean,
                        stdev: e.expectedChangeStDev,
                        min: e.expectedChangeMin,
                        max: e.expectedChangeMax,
                    });
                    base.inflationAdjusted = e.inflationAdjustment || false;
                    base.userFraction = e.userPercentage || 1.0;
                    if (e.eventType === "income") {
                        base.socialSecurity = e.isSocialSecurity || false;
                    } else if (e.eventType === "expense") {
                        base.discretionary = e.isDiscretionary || false;
                    }
                }

                if (e.eventType === "invest" || e.eventType === "rebalance") {
                    base.assetAllocation = buildAllocationMap(e.initialAllocation || e.fixedAllocation || []);
                    base.glidePath = e.assetAllocationType === "glidepath";
                    if (base.glidePath) {
                        base.assetAllocation2 = buildAllocationMap(e.finalAllocation || []);
                    }
                    if (e.maxCash !== undefined) {
                        base.maxCash = e.maxCash;
                    }
                }

                return base;
            });
        };



        const yamlData = {
            name: scenario.name,
            description: scenario.description || "",
            maritalStatus: scenario.marital_status === "married" ? "couple" : "individual",
            birthYears: scenario.birth_year_spouse
                ? [scenario.birth_year, scenario.birth_year_spouse]
                : [scenario.birth_year],
            lifeExpectancy: (() => {
                const result = [];
                const primary = scenario.life_expectancy
                    ? { type: "fixed", value: scenario.life_expectancy }
                    : { type: "normal", mean: scenario.life_expectancy_mean, stdev: scenario.life_expectancy_stdv };
                result.push(primary);
                if (scenario.marital_status === "married") {
                    const spouse = scenario.life_expectancy_spouse
                        ? { type: "fixed", value: scenario.life_expectancy_spouse }
                        : { type: "normal", mean: scenario.life_expectancy_mean_spouse, stdev: scenario.life_expectancy_stdv_spouse };
                    result.push(spouse);
                }
                return result;
            })(),

            investmentTypes: investmentTypes,

            investments: investments,

            eventSeries: buildEventSeriesYaml(scenario.event_series, userInvestments),

            inflationAssumption: {
                type: "fixed",
                value: scenario.inflation_assumption,
            },
            afterTaxContributionLimit: parseFloat(scenario.init_limit_aftertax.toString()),

            spendingStrategy: Array.isArray(scenario.spending_strategy)
                ? scenario.spending_strategy.map(ev => ev.name)
                : [],
            expenseWithdrawalStrategy: Array.isArray(scenario.expense_withdrawal_strategy)
                ? scenario.expense_withdrawal_strategy.map(inv => inv._id.toString())
                : [],
            RMDStrategy: Array.isArray(scenario.rmd_strategy)
                ? scenario.rmd_strategy.map(inv => inv._id.toString())
                : [],

            RothConversionOpt: scenario.has_rothOptimizer === "rothOptimizer_on",
            RothConversionStart: scenario.has_rothOptimizer === "rothOptimizer_on"
                ? scenario.roth_startYr ?? null
                : null,
            RothConversionEnd: scenario.has_rothOptimizer === "rothOptimizer_on"
                ? scenario.roth_endYr ?? null
                : null,

            RothConversionStrategy: Array.isArray(scenario.roth_conversion_strategy)
                ? scenario.roth_conversion_strategy.map(inv => inv._id.toString())
                : [],

            financialGoal: parseFloat(scenario.financial_goal.toString()),
            residenceState: scenario.state_of_residence,
        };

        const yamlStr = yaml.dump(yamlData);

        // // saves YAML file to project directory
        // const exportDir = path.join(__dirname, "../../exports");
        // // Ensure the directory exists
        // if (!fs.existsSync(exportDir)) {
        //     fs.mkdirSync(exportDir, { recursive: true });
        // }
        // const filePath = path.join(__dirname, `../../exports/scenario-${scenario._id}.yaml`);
        // fs.writeFileSync(filePath, yamlStr, "utf8");

        res.setHeader("Content-disposition", `attachment; filename=scenario-${scenario._id}.yaml`);
        res.setHeader("Content-type", "text/yaml");
        res.send(yamlStr);

    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
