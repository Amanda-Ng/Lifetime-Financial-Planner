const FederalTaxes = require("../../models/FederalTaxes");
const StateTaxes = require("../../models/StateTaxes");

/**
 * Query federal tax brackets for a given year.
 * @param {number} year - The year to query tax brackets for.
 * @returns {Promise<Array>} - Returns an array of federal tax brackets.
 */
async function queryFederalTaxBrackets(year) {
    const federalTaxes = await FederalTaxes.findOne({ year });
    if (!federalTaxes) {
        throw new Error(`Federal tax data not found for year ${year}`);
    }

    // Assuming single filing status for simplicity
    return Array.from(federalTaxes.single_federal_income_tax.entries()).map(([key, value]) => ({
        lowerLimit: parseFloat(key),
        upperLimit: value === null ? null : parseFloat(value),
    }));
}

/**
 * Query state tax brackets for a given year and state.
 * @param {number} year - The year to query tax brackets for.
 * @param {string} state - The state to query tax brackets for.
 * @returns {Promise<Array>} - Returns an array of state tax brackets.
 */
async function queryStateTaxBrackets(year, state) {
    const stateTaxes = await StateTaxes.findOne({ year, state });
    if (!stateTaxes) {
        throw new Error(`State tax data not found for year ${year} and state ${state}`);
    }

    // Assuming single filing status for simplicity
    return stateTaxes.single_tax_brackets.map(bracket => ({
        lowerLimit: bracket.lowerLimit,
        upperLimit: bracket.upperLimit,
        rate: bracket.rate,
    }));
}

module.exports = {
    queryFederalTaxBrackets,
    queryStateTaxBrackets,
};