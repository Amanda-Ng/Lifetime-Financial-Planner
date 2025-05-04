const EventSeries = require("../models/EventSeries");
const Investment = require("../models/Investment");
const FederalTaxes = require("../models/FederalTaxes");
const RMD = require("../models/RMD");
const seedRandom = require("seedrandom");

// Test imports
const configs = require("../configs/config.js");
const mongoose = require("mongoose");
mongoose.connect(configs.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));
db.once("open", () => console.log("Connected to MongoDB"));
//

async function checkLifeExpectancy(scenario, year) {
    const living = {};
    if (scenario.birth_year + scenario.life_expectancy - year <= 0) {
        living["user"] = "dead";
    } else {
        living["user"] = "alive";
    }

    if (scenario.birth_year_spouse + scenario.life_expectancy_spouse - year <= 0) {
        living["spouse"] = "dead";
    } else {
        living["spouse"] = "alive";
    }

    return living;
}

let earlyWithdrawalTaxTotal = 0; // Global variable to track early withdrawal tax

function resetEarlyWithdrawalTax() {
    earlyWithdrawalTaxTotal = 0; // Reset the tax at the start of each simulation year
}

function getEarlyWithdrawalTax() {
    return earlyWithdrawalTaxTotal; // Retrieve the current value of the tax
}

//run income events series: return total income
function totalIncome_events(scenario, year) {
    let totalIncome = 0;
    const numYears = year - new Date().getFullYear();
    scenario.event_series.forEach((event) => {
        // Check if the event is of type "income"
        if (event.eventType === "income") {
            let eventIncome = event.initialAmount;
            if (event.inflationAdjustment) {
                for (let i = 1; i <= numYears; i++) {
                    eventIncome = (eventIncome + event.expectedChange) * (1 + scenario.inflation_assumption / 100);
                }
                totalIncome += eventIncome;
            } else {
                totalIncome += eventIncome + numYears * event.expectedChange;
            }
        }
    });
    return totalIncome;
}
function parseTaxBrackets(taxBrackets) {
    const parsedBrackets = [];
    taxBrackets.forEach((value, key) => {
        const bounds = key.split(",");
        const lowerBound = parseFloat(bounds[0]);
        const upperBound = parseFloat(bounds[1]);
        parsedBrackets.push({
            lower_bound: lowerBound,
            upper_bound: upperBound,
            value: value,
        });
    });
    return parsedBrackets;
}

async function queryFederalTaxBrackets(targetYear, marital_status) {
    const past_year_taxes = await FederalTaxes.findOne({ year: targetYear }); // get the tax data for the year that just passed
    const tax_brackets = {};
    // get tax brackets based on the user's marital status
    if (marital_status.toLowerCase() === "single") {
        tax_brackets["fit"] = parseTaxBrackets(past_year_taxes.single_federal_income_tax);
        tax_brackets["std"] = past_year_taxes.single_standard_deductions;
        tax_brackets["cgt"] = parseTaxBrackets(past_year_taxes.single_capital_gains_tax);
    } else if (marital_status.toLowerCase() === "married") {
        tax_brackets["fit"] = parseTaxBrackets(past_year_taxes.married_federal_income_tax);
        tax_brackets["std"] = past_year_taxes.married_standard_deductions;
        tax_brackets["cgt"] = parseTaxBrackets(past_year_taxes.married_capital_gains_tax);
    } else {
        // if not single or married, just throw an error (this should not happen)
        throw new Error("Invalid marital status");
    }
    return tax_brackets;
}

async function calculateFederalTaxes(scenario, currentYear) {
    let tax_brackets = await queryFederalTaxBrackets(currentYear, scenario.marital_status); // get the tax brackets for the current year

    let taxable_income = calcTaxableIncome(scenario); //REVIEW: is this better to calc again instead of read from saved value? cuz it could possibly be undefined// scenario.totalTaxedIncome; // get the total taxable income (done in another function)
    let total_tax = 0;
    let federal_income_tax = 0;

    // find the federal tax brackets that the user falls under, subtracting them from the total taxable income each time
    for (const { lower_bound, upper_bound, value } of tax_brackets["fit"]) {
        if (taxable_income === 0) {
            // if no more taxable income, break
            break;
        }
        // const bounds = key.split(",");
        // const lower_bound = Number(bounds[0]);
        // const upper_bound = Number(bounds[1]);
        if (taxable_income >= lower_bound && taxable_income <= upper_bound) {
            // if taxable income is between the bounds, then that is all that is left --> taxable income = 0 afterwards so break
            const tax = taxable_income * (value / 100);
            federal_income_tax += tax;
            taxable_income -= taxable_income;
            break;
        } else if (taxable_income > upper_bound) {
            // exceeds upper bound of this bracket --> take the maximum value, calculate and subtract
            const tax = upper_bound * (value / 100);
            federal_income_tax += tax;
            taxable_income -= upper_bound;
        }
    }

    total_tax += federal_income_tax;
    total_tax += tax_brackets["std"]; // add the standard deduction

    return total_tax;
}
// async function runIncomeEvents({ year, scenario }) {
//     const events = await EventSeries.find({
//       eventType: "income",
//       userId: scenario.userId
//     });

//     let totalIncome = 0;

//     for (const event of events) {
//       const active = isEventActive(event, year);
//       if (!active) continue;

//       const adjustedAmount = adjustForInflation(event.initialAmount, event, scenario, year);
//       totalIncome += adjustedAmount * (event.userPercentage ?? 1);
//     }

//     // Update cash investment or pass this forward
//     return totalIncome;
//   }

function seedRNG(seed = null) {
    // Return Type :() => number
    return seed ? seedRandom(seed) : Math.random;
}

function setEventParams(event, rng = Math.random) {

    // FIXME: This is a temporary fix to avoid using the eventRandomMap
    // const eventRandomMap = {}; // This should be a global variable or passed as an argument
    // if (!eventRandomMap[event._id]) {
    //     eventRandomMap[event._id] = {
    //         startYear: getEventField(event, "startYear", event.startYearType, rng),
    //         duration: getEventField(event, "duration", event.durationType, rng),
    //         expectedChange: getEventField(event, "expectedChange", event.expectedChangeType, rng),
    //     };
    // }
    // return eventRandomMap[event._id];

    event["startYear"] = getEventField(event, "startYear", event.startYearType, rng);
    event["duration"] = getEventField(event, "duration", event.durationType, rng);
    event["expectedChange"] = getEventField(event, "expectedChange", event.expectedChangeType, rng);

    return {
        startYear: event.startYear,
        duration: event.duration,
        expectedChange: event.expectedChange
    };
}

function getEventField(event, fieldGroup, type, rng = Math.random) {
    switch (type) {
        case "fixed":
            return event[fieldGroup];
        case "normal":
            const mean = event[`mean${capitalize(fieldGroup)}`];
            const std = event[`stdDev${capitalize(fieldGroup)}`];
            return normalSample(mean, std, rng);
        case "uniform":
            const min = event[`min${capitalize(fieldGroup)}`];
            const max = event[`max${capitalize(fieldGroup)}`];
            return uniformSample(min, max, rng);
        default:
            // throw new Error(`Unknown distribution type: ${type}`);
            return event[fieldGroup]; // Fallback to fixed value
    }
}

function uniformSample(min, max, rng) {
    return min + (max - min) * rng();
}

function normalSample(mean, stddev, rng) {
    const u = 1 - rng();
    const v = 1 - rng();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + stddev * z;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function inflationAdjusted(initialAmount, inflationRate, yearsElapsed) {
    return initialAmount * Math.pow(1 + (inflationRate ?? 0) / 100, yearsElapsed);
}

function setScenarioLifeExpectancy(scenario, rng = Math.random) {
    const getLE = (mean, std, fixed) => {
        if (fixed !== undefined) return fixed;
        if (mean !== undefined && std !== undefined) return normalSample(mean, std, rng);
        return null;
    };

    scenario.life_expectancy = getLE(scenario.life_expectancy_mean, scenario.life_expectancy_stdv, scenario.life_expectancy);
    scenario.life_expectancy_spouse = getLE(scenario.life_expectancy_mean_spouse, scenario.life_expectancy_stdv_spouse, scenario.life_expectancy_spouse);

    return {
        user: scenario.life_expectancy,
        spouse: scenario.life_expectancy_spouse,
    };
}

function computeInvestmentValue(value, baseValue, type, rng = Math.random) {
    switch (type) {
        case "fixedAmount":
            return parseFloat(value);
        case "fixedPercentage":
            return (parseFloat(value) / 100) * baseValue;
        case "randomAmount":
            return normalSample(value.mean, value.stddev, rng);
        case "randomPercentage":
            return (normalSample(value.mean, value.stddev, rng) / 100) * baseValue;
        default:
            throw new Error(`Unknown value type: ${type}`);
    }
}

function updateInvestments(scenario, rng = Math.random) {
    scenario.investments.forEach((investment) => {
        const investmentType = investment.investmentType;
        const investmentValue = computeInvestmentValue(investmentType.expected_annual_return, investment.value, investmentType.returnType, rng);
        const incomeValue = computeInvestmentValue(investmentType.expected_annual_income, investment.value, investmentType.incomeType, rng);

        investment["calculatedAnnualReturn"] = investmentValue;
        investment["calculatedAnnualIncome"] = incomeValue;
        // Update the value of the investment
        endValueBeforeExpenses = investment.value + investmentValue + incomeValue;
        expenses = (investmentType.expense_ratio * (endValueBeforeExpenses + investment.value)) / 2; // Average of beginning and end value
        investment.value = endValueBeforeExpenses - expenses;
    });
    return scenario.investments;
}

// Does not account for percentage from the value of investment at beginning of year
// function getInvestmentTypeParams(investmentTypeRandomMap, investmentType, rng = Math.random) {
//     if (!investmentTypeRandomMap[investmentType._id]) {
//         investmentTypeRandomMap[investmentType._id] = {
//             expectedAnnualReturn: getInvestmentField(investmentType, "expected_annual_return", investmentType.returnType, rng),
//             expectedAnnualIncome: getInvestmentField(investmentType, "expected_annual_income", investmentType.returnType, rng),
//         };
//     }
//     return investmentTypeRandomMap[investmentType._id];
// }

// function getInvestmentField(investmentType, fieldGroup, type, rng = Math.random) {
//     switch (type) {
//         case "fixedAmount":
//             return investmentType[fieldGroup];
//         case "fixedPercentage":
//             return investmentType[fieldGroup] * investmentType.value;
//         case "randomAmount":
//             const mean = investmentType[`mean${capitalize(fieldGroup)}`];
//             const std = investmentType[`stdDev${capitalize(fieldGroup)}`];
//             return normalSample(mean, std, rng);
//         case "randomPercentage":
//             const min = investmentType[`min${capitalize(fieldGroup)}`];
//             const max = investmentType[`max${capitalize(fieldGroup)}`];
//             return uniformSample(min, max, rng) * investmentType.value;
//         default:
//             throw new Error(`Unknown distribution type: ${type}`);
//     }
// }

//return amt of capital gains tax that should be paid
async function calculateCapitalGainsTax(scenario, year) {
    let tax_brackets = await queryFederalTaxBrackets(year, scenario.marital_status); // get the tax brackets for the current year

    // scenario.capitalsSold = scenario.investments.filter((investment) => investment.tax_status === "non-retirement" && investment.investmentType.name !== "Cash"); // get the capital gains investments that were sold
    scenario.capitalsSold = {} // initialize capitalsSold for the year
    scenario.capitalsSold[year] = [] // initialize capitalsSold for the year

    let netCapitalGain = 0;
    for (const capital of scenario.capitalsSold[year] || []) {
        const expectedValue = capital.withdrawalOrigin.value * capital.percentSold; // value already inflation-adjusted
        const invest = await Investment.findById(capital.withdrawalOrigin._id).exec();
        netCapitalGain = expectedValue - invest.value; // current - initial value
    }
    let total_tax = 0;
    // find the federal tax brackets that the user falls under, subtracting them from the total taxable income each time
    for (const { lower_bound, upper_bound, value } of tax_brackets["cgt"]) {
        if (netCapitalGain === 0) {
            break;  // if no more taxable gains, break
        }
        if (taxable_income >= lower_bound && taxable_income <= upper_bound) {
            // if remaining taxable gain is between the bounds, then that is all that is left --> taxable gains = 0 afterwards so break
            const tax = netCapitalGain * (value / 100);
            total_tax += tax;
            netCapitalGain -= taxable_income;
            break;
        } else if (netCapitalGain > upper_bound) {
            // exceeds upper bound of this bracket --> take the maximum value, calculate and subtract
            const tax = upper_bound * (value / 100);
            total_tax += tax;
            netCapitalGain -= upper_bound;
        }
    }
    return total_tax;
}

function runIncomeEvents(scenario, year, rng = Math.random) {
    let totalIncome = 0;
    const events = scenario.event_series.filter((event) => event.eventType === "income");

    for (const event of events) {
        const { startYear, duration, expectedChange } = setEventParams(event, rng);
        if (year >= startYear && year < startYear + duration) {
            const inflationAdjustedAmount = inflationAdjusted(event.initialAmount, scenario.inflation_assumption, year - startYear);
            totalIncome += inflationAdjustedAmount + expectedChange;
        }
    }

    scenario.investments.find((investment) => investment.investmentType.name === "Cash").value += totalIncome;

    return totalIncome;
}

async function queryRMDTable(year) {
    const rmdData = await RMD.findOne({ year });
    if (!rmdData) {
        throw new Error(`RMD table for year ${year} not found.`);
    }
    return rmdData.distributions;
}

async function performRMD(scenario, retirementInvestment, age, year) {
    const rmdTable = await queryRMDTable(year); // Query RMD table for the given year
    const expectedAge = age + year - new Date().getFullYear();
    const rmdFactor = rmdTable.get(expectedAge.toString());
    if (!rmdFactor) {
        throw new Error(`RMD factor for age ${expectedAge} not found in year ${year}.`);
    }

    const rmd = retirementInvestment.value / rmdFactor;
    let transferredInvestment = scenario.rmd_strategy.shift();

    if (transferredInvestment.tax_status === "non-retirement") {
        transferredInvestment = scenario.rmd_strategy.shift();
    }
    if (transferredInvestment.value < rmd) {
        rmd -= transferredInvestment.value;
        transferredInvestment.tax_status = "non-retirement";
    } else if (transferredInvestment.value > rmd) {
        const nonRetirementInvestments = scenario.investments.filter(
            (investment) => investment.tax_status === "non-retirement"
        );
        let target = nonRetirementInvestments.find(
            (investment) => investment.investmentType.name === transferredInvestment.investmentType.name
        );
        if (target) {
            target.value += rmd;
            transferredInvestment.value -= rmd;
            rmd = 0;
        } else {
            transferredInvestment.value -= rmd;
            scenario.investments.push({
                investmentType: transferredInvestment.investmentType,
                value: rmd,
                tax_status: "non-retirement",
                userId: scenario.userId,
            });
            rmd = 0;
        }
    } else {
        rmd = 0;
        transferredInvestment.tax_status = "non-retirement";
    }
    return rmd;
}

function calcTaxableIncome(scenario) {
    let taxableIncome = 0;
    const incomeEvents = scenario.event_series.filter((event) => event.eventType === "income");
    const taxableInvestments = scenario.investments.filter((investment) => investment.tax_status === "non-retirement" || investment.investmentType.taxability === "taxable");
    taxableInvestments.forEach((investment) => {
        taxableIncome += investment["calculatedAnnualIncome"];
    });
    incomeEvents.forEach((event) => {
        taxableIncome += event.expectedChange;
    });

    return taxableIncome;
}


function runRothConversion(scenario, year) {
    let taxableIncome = calcTaxableIncome(scenario);

    // Query federal tax brackets from database using the current year
    const taxBrackets = queryFederalTaxBrackets(year);

    let remainingAmtToConvert = 0;

    for (const bracket of taxBrackets["fit"]) {
        const bracketCeil = bracket.upper_bound;

        if (bracketCeil === null) {
            return 0; // At the highest bracket, cannot convert
        }

        if (taxableIncome > bracketCeil) {
            taxableIncome -= bracketCeil;
        } else {
            remainingAmtToConvert = bracketCeil - taxableIncome;
            break;
        }
    }

    let preTaxAccounts = scenario.roth_conversion_strategy.filter((account) => account.tax_status === "pre-tax retirement");
    let afterTaxAccounts = scenario.investments.filter((account) => account.tax_status === "after-tax retirement");
    while (remainingAmtToConvert !== 0) {
        const withdrawalOrigin = preTaxAccounts.find((account) => account.value > 0);

        if (!withdrawalOrigin) {
            return 0; // Cannot do Roth conversion
        }

        let amtToConvert = 0;

        if (withdrawalOrigin.value > remainingAmtToConvert) {
            withdrawalOrigin.value -= remainingAmtToConvert;
            amtToConvert = remainingAmtToConvert;
            remainingAmtToConvert = 0;

            // Choose transfer destination
            let hasSameTypeInvestment = false;

            for (const account of afterTaxAccounts) {
                if (withdrawalOrigin.investmentType === account.investmentType) {
                    hasSameTypeInvestment = true;
                    account.value += amtToConvert;
                    break;
                }
            }

            if (!hasSameTypeInvestment) {
                const newAfterTaxAccount = {
                    investmentType: withdrawalOrigin.investmentType,
                    value: amtToConvert,
                };
                scenario.investments.push(newAfterTaxAccount);
            }

            //REVIEW: Don't need this Update withdrawalOrigin and newAfterTax account in database
            // updateAccountInDatabase(withdrawalOrigin);
            // if (!hasSameTypeInvestment) {
            //     updateAccountInDatabase(user.afterTaxAccounts[user.afterTaxAccounts.length - 1]);
            // }
        } else {
            amtToConvert = withdrawalOrigin.value;
            remainingAmtToConvert -= amtToConvert;
            withdrawalOrigin.tax_status = "after-tax retirement";
        }


    }

    return 1; // Successful conversion
}

// function getCash(investments) {
//     let cashInvestments = investments.filter(investment => investment.investmentType.name === "Cash");
//     let totalCash = 0;
//     cashInvestments.forEach(investment => {
//         totalCash += investment.value;
//     });
//     return totalCash;
// }

//return the first investment by the Expense withdrawal strategy that has a non 0 balance
function withdrawal_next(withdrawStrat) {
    for (const invest of withdrawStrat) {
        if (invest.value === 0) continue;
        return invest;
    }
    return null;
}

//return boolean: if investment is a capital
function isCapital(investment) {
    //any non retirement that's not cash
    if (investment.investmentType.name !== "cash" && investment.tax_status === "non-retirement") {
        return true;
    } else {
        return false;
    }

}

//return 0 if required_payment cannot be paid and an expense is incurred
//return 1 if successful
function pay_nonDiscretionary_helper(scenario, required_payment, year) {
    if (!scenario.capitalsSold) {
        scenario.capitalsSold = {}; // Initialize capitalsSold if it doesn't exist
    }
    if (!scenario.capitalsSold[year]) {
        scenario.capitalsSold[year] = []; // Initialize capitalsSold for the year
    }


    cashInvest = scenario.investments.find(investment => investment.investmentType.name === "Cash")
    if (cashInvest.value > required_payment) {     //enough to pay with cash
        cashInvest.value -= required_payment
    } else {  //need withdrawals 
        while (required_payment != 0) {
            withdrawalOrigin = withdrawal_next(scenario.expense_withdrawal_strategy)
            if (withdrawalOrigin == null) {       //user cannot pay, incur and create expense  
                let newExpense = new EventSeries({
                    name: "Incurred Expense: Non Discretionary: " + year,
                    startYearType: "fixed",
                    startYear: year,
                    durationType: "fixed",
                    eventType: "expense",
                    userId: user.googleId,
                    initialAmount: required_payment,
                    expectedChangeType: "fixedAmount",
                    expectedChange: 0,
                    user_spouse_ratio: user.isMarried ? 0.5 : 1
                })
                scenario.event_series.append(newExpense)
                return 0
            }
            let earlyWithdrawal
            calcAge = year - scenario.birth_year
            earlyWithdrawal = false
            if ((withdrawalOrigin.tax_status === "pre-tax retirement" ||
                withdrawalOrigin.tax_status === "after-tax retirement")
                && calcAge < 59.5) {	//early withdrawal tax
                earlyWithdrawal = true
            }
            if (withdrawalOrigin.value > required_payment) {       //enough balance
                if (earlyWithdrawal)
                    required_payment += required_payment * .1
                earlyWithdrawalTaxTotal += required_payment * .1;
            }
            if (withdrawalOrigin.value > required_payment) {
                if (isCapital(withdrawalOrigin)) {
                    scenario.capitalsSold[year].push({
                        withdrawalOrigin: { ...withdrawalOrigin },
                        percentSold: required_payment / withdrawalOrigin.value
                    });
                }
                withdrawalOrigin.value -= required_payment;
                required_payment = 0;
                continue;
            }
            if (earlyWithdrawal) {
                required_payment += withdrawalOrigin.value * .1
                earlyWithdrawalTaxTotal += withdrawalOrigin.value * .1;
            }
            if (isCapital(withdrawalOrigin)) {
                scenario.capitalsSold[year].push({
                    withdrawalOrigin: { ...withdrawalOrigin },
                    percentSold: required_payment / withdrawalOrigin.value
                });
            }
            required_payment -= withdrawalOrigin.value
            withdrawalOrigin.value = 0
        }
        return 1
    }
}

async function pay_nonDiscretionaryTaxes(scenario, year) {
    let required_payment = 0;
    const expenses = scenario.event_series.filter((event) => event.eventType === "expense");
    for (const expense of expenses) {
        if (!expense.isDiscretionary) {
            let adjustedExpense;
            if (expense.inflationAdjustment) {
                adjustedExpense = inflationAdjusted(expense.initialAmount, scenario.inflation_assumption, year - scenario.birth_year);
            } else {
                adjustedExpense = expense.initialAmount;
            }
            required_payment += adjustedExpense;
        }
    }
    //!! need to addcalcStateTaxes(user,year)     
    required_payment += await calculateFederalTaxes(scenario, year - 1)
    pay_nonDiscretionary_helper(scenario, required_payment, year)
    required_payment = calculateCapitalGainsTax(scenario, year)
    pay_nonDiscretionary_helper(scenario, required_payment, year)

}

//return list of events expenses appllicable for the year
function getExpenses_byYear(scenario, year) {
    // copy of expenses
    const expenses = scenario.event_series
        .filter(event => event.eventType === "expense")
        .map(expense => ({ ...expense }));
    let arr = [];
    for (const expense of expenses) {
        const endYear = expense.startYear + expense.duration;
        if (expense.startYear <= year && endYear >= year) {
            arr.push(expense);
        }
    }
    return arr;
}

//return -1 if violated financial goal
//return amount of discretionary expenses paid for success
function pay_discretionary(scenario, user, year) {
    let totalInvestmentValue = 0;
    let totalPaid = 0;

    for (const investment of scenario.investments) {
        totalInvestmentValue += investment.value;
    }
    const expenses = getExpenses_byYear(scenario, year);

    for (const expense of expenses) {
        let adjustedExpense
        if (expense.inflationAdjustment) {
            yearsElapsed = year - new Date().getFullYear();
            adjustedExpense = inflationAdjusted(expense.initialAmount, expense.inflationAdjustment, yearsElapsed);
        } else {
            adjustedExpense = expense.initialAmount;
        }
        let cashInvest = scenario.investments.find(investment => investment.investmentType.name === "Cash")
        let withdrawalOrigin
        let earlyWithdrawal
        while (adjustedExpense != 0) {
            if (totalInvestmentValue - adjustedExpense >= scenario.financial_goal) {
                if (cashInvest.value >= adjustedExpense) {
                    cashInvest.value -= adjustedExpense;
                    totalPaid += adjustedExpense;
                } else {
                    // make withdrawal
                    let withdrawalOrigin = withdrawal_next(scenario.expense_withdrawal_strategy);
                    if (withdrawalOrigin == null) continue; // expense not paid

                    let earlyWithdrawal = false;
                    if (
                        (withdrawalOrigin.tax_status === "pre-tax retirement" ||
                            withdrawalOrigin.tax_status === "after-tax retirement") &&
                        calcAge < 59.5
                    ) {
                        earlyWithdrawal = true; // early withdrawal tax
                    }

                    if (withdrawalOrigin.value > adjustedExpense) {     //enough balance
                        if (earlyWithdrawal) {
                            pay_nonDiscretionary_helper(scenario, adjustedExpense * 0.1, year);
                            totalInvestmentValue -= adjustedExpense * 0.1;
                        }

                        if (isCapital(withdrawalOrigin)) {      //consider capital gains  
                            if (!scenario.capitalsSold[year])
                                scenario.capitalsSold[year] = [];

                            scenario.capitalsSold[year].push({
                                withdrawalOrigin: { ...withdrawalOrigin },
                                percentSold: adjustedExpense / withdrawalOrigin.value
                            });
                        }

                        withdrawalOrigin.value -= adjustedExpense;
                        totalInvestmentValue -= adjustedExpense;
                        totalPaid += adjustedExpense;
                        adjustedExpense = 0;
                        continue;
                    } else {						//deplete investment  
                        if (earlyWithdrawal) {
                            pay_nonDiscretionary_helper(scenario, withdrawalOrigin.value * 0.1, year);
                            totalInvestmentValue -= adjustedExpense * 0.1;
                        }
                        if (isCapital(withdrawalOrigin))
                            scenario.capitalsSold[year].push({
                                withdrawalOrigin: { ...withdrawalOrigin },
                                percentSold: 1
                            });
                        totalPaid += withdrawalOrigin.value;
                        adjustedExpense -= withdrawalOrigin.value
                        totalInvestmentValue -= withdrawalOrigin.value
                        withdrawalOrigin.value = 0
                    }
                }
            } else {
                return -1       //violated financial goal
            }
        }
    }
    return totalPaid
}

//allocate excess cash for all InvestEvents
//stop running when there's no excess cash and return  
//return 0 for success 
async function runScheduled_investEvent(InvestEvents, scenario,year) {
    const cashInvest = scenario.investments.find(investment => investment.investmentType.name === "Cash");
    for (const InvestEvent of InvestEvents) {
        let excessCash;
        if (!InvestEvent.fixedAllocation) {   //nothing to reallocate 
            return 0;
        }
        if (cashInvest.value < InvestEvent.maxCash) {
            return 0; // no excess cash to invest
        } else {
            excessCash = cashInvest.value - InvestEvent.maxCash;
        }
        //match percent to investment based on index if not done so 
        //{Investment, percent}
        let userInvestments = await Investment.find({ userId: scenario.userId }).populate("investmentType");
        if (InvestEvent.fixedAllocation[0].Investment) {
            //handle assetAllocation: an arr of values, index corresponds to each of the user's investments
            for (let i = 0; i < InvestEvent.initialAllocation.length; i++) {
                if (InvestEvent.fixedAllocation[i] != null) {
                    let percent = InvestEvent.initialAllocation[i];
                    let invest = userInvestments[i]; //find the matching investment 

                    invest = scenario.investments.find(inv => inv._id.toString() === invest._id.toString()); //find local copy of the investment  
                    InvestEvent.initialAllocation[i] = { investment: invest, percent: percent };
                }
            }
            //handle assetAllocation2
            if (InvestEvent.assetAllocationType == "glidepath") {
                for (let i = 0; i < InvestEvent.finalAllocation.length; i++) {
                    if (InvestEvent.finalAllocation[i] != null) {
                        let percent = InvestEvent.finalAllocation[i];
                        let invest = userInvestments[i]; //find the matching investment 

                        invest = scenario.investments.find(inv => inv._id.toString() === invest._id.toString()); //find local copy of the investment  
                        InvestEvent.finalAllocation[i] = { investment: invest, percent: percent };
                    }
                }
            }
        }
        let startYear = new Date().getFullYear()
        let endYear = scenario.birth_year + scenario.life_expectancy
        let yearsLapsed = scenario.year - startYear
        for (let i = 0; i < InvestEvent.initialAllocation.length; i++) {
            let investment = InvestEvent.initialAllocation[i].investment
            let adjustedPercent = initialAllocation[i].percent  //will account for linear change in glidepath
            //adjust inflation investment value elsewhere
            let adjustedAnnualLimit = null
            if (InvestEvent.assetAllocationType == "glidepath") {
                let endPercent = InvestEvent.finalAllocation[i].percent
                adjustedPercent = adjustedPercent + ((endPercent - adjustedPercent) * yearsLapsed) / (endYear - startYear);
            }
            if (investment.tax_status === "pre-tax retirement" || investment.tax_status === "after-tax retirement") {
                if (investment.tax_status === "pre-tax retirement") {
                    adjustedAnnualLimit = inflationAdjusted(scenario.init_limit_pretax, scenario.inflationAssumption, yearsLapsed);
                } else {
                    adjustedAnnualLimit = inflationAdjusted(scenario.init_limit_aftertax, scenario.inflationAssumption, yearsLapsed);
                }
            }
            let investAmt;
            if (adjustedAnnualLimit != null && (excessCash * adjustedPercent) < adjustedAnnualLimit) {
                investAmt = excessCash * adjustedPercent;
            } else {
                investAmt = excessCash * adjustedPercent;
            }
            investment.value += investAmt;
        }
    }
    return 0
}

function rebalanceInvestments(scenario, rebalanceEvent) {
    const totalValue = scenario.investments.reduce((sum, investment) => sum + investment.value, 0);

    rebalanceEvent.assetAllocation.forEach(({ investmentType, targetPercentage }) => {
        const targetValue = totalValue * (targetPercentage / 100);
        const investment = scenario.investments.find((inv) => inv.investmentType.name === investmentType.name);

        if (investment) {
            const difference = targetValue - investment.value;

            if (difference > 0) {
                // Buy more of this investment
                const cashInvestment = scenario.investments.find((inv) => inv.investmentType.name === "Cash");
                if (cashInvestment.value >= difference) {
                    cashInvestment.value -= difference;
                    investment.value += difference;
                }
            } else if (difference < 0) {
                // Sell excess of this investment
                investment.value += difference; // difference is negative
                const cashInvestment = scenario.investments.find((inv) => inv.investmentType.name === "Cash");
                cashInvestment.value -= difference; // add the sold amount to cash
            }
        }
    });
}

 

module.exports = {
    checkLifeExpectancy,
    totalIncome_events,
    parseTaxBrackets,
    queryFederalTaxBrackets,
    calculateFederalTaxes,
    seedRNG,
    setEventParams,
    getEventField,
    uniformSample,
    normalSample,
    capitalize,
    inflationAdjusted,
    setScenarioLifeExpectancy,
    computeInvestmentValue,
    updateInvestments,
    calculateCapitalGainsTax,
    runIncomeEvents,
    queryRMDTable,
    performRMD,
    calcTaxableIncome,
    runRothConversion,
    withdrawal_next,
    isCapital,
    pay_nonDiscretionary_helper,
    pay_nonDiscretionaryTaxes,
    getExpenses_byYear,
    pay_discretionary,
    runScheduled_investEvent,
    rebalanceInvestments,
    resetEarlyWithdrawalTax,
    getEarlyWithdrawalTax
};