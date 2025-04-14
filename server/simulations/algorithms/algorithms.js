const EventSeries = require("../../models/EventSeries");
const Investment = require("../../models/Investment");
const seedRandom = require("seedrandom");

//run income events series: return total income
function totalIncome_events(scenario, year){
    let totalIncome=0; 
    const numYears = year- (new Date().getFullYear())
    scenario.event_series.forEach((event) => {
        // Check if the event is of type "Income"
        if (event.eventType === "Income") {
            let eventIncome = event.initialAmount
            if (event.inflationAdjustment) { 
                for (let i = 1; i <= numYears; i++) {
                    eventIncome = (eventIncome + event.expectedChange) * (1 + scenario.inflation_assumption / 100);
                }
                totalIncome +=eventIncome
            } else {
                totalIncome +=eventIncome+ numYears*event.expectedChange;
            }
        }
    });
    return totalIncome;
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


function seedRNG(seed = null) { // Return Type :() => number
    return seed ? seedRandom(seed) : Math.random;
}

function getEventParams(eventRandomMap, event, rng = Math.random) {
    if (!eventRandomMap[event._id]) {
        eventRandomMap[event._id] = {
            startYear: getEventField(event, "startYear", event.startYearType, rng),
            duration: getEventField(event, "duration", event.durationType, rng),
            expectedChange: getEventField(event, "expectedChange", event.expectedChangeType, rng),
        };
    }
    return eventRandomMap[event._id];
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
            throw new Error(`Unknown distribution type: ${type}`);
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

function getScenarioLifeExpectancy(scenario, rng = Math.random) {
    const getLE = (mean, std, fixed) => {
        if (fixed !== undefined) return fixed;
        if (mean !== undefined && std !== undefined) return normalSample(mean, std, rng);
        return null;
    };

    return {
        user: getLE(scenario.life_expectancy_mean, scenario.life_expectancy_stdv, scenario.life_expectancy),
        spouse: getLE(scenario.life_expectancy_mean_spouse, scenario.life_expectancy_stdv_spouse, scenario.life_expectancy_spouse)
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

