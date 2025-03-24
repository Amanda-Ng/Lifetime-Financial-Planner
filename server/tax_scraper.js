const puppeteer = require("puppeteer-extra");
const mongoose = require("mongoose");
const Taxes = require("./models/FederalTaxes");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

async function scrape_federal_income_taxes() {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.irs.gov/filing/federal-income-tax-rates-and-brackets", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table");

    const single_federal_income_tax = await page.evaluate(() => {
        // find heading of table
        const table_head = Array.from(document.querySelectorAll("h2")).find((t) => t.innerHTML.toLowerCase().includes("single"));
        if (!table_head) return null;

        // traverse HTML to find sibling element that is the table corresponding to the heading
        let table = table_head;
        let found_table = false;
        while (!table.matches("table")) {
            table = table.nextElementSibling;
            if (table.matches("table")) found_table = true;
        }
        if (!found_table) return null; // ensure that table was found

        table = table.querySelector("tbody");
        return Array.from(table.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim()));
    });

    const married_federal_income_tax = await page.evaluate(() => {
        const table_head = Array.from(document.querySelectorAll("h4")).find((t) => t.innerText.toLowerCase().includes("married filing jointly"));
        if (!table_head) return null;

        // go back up until overarching parent element (that includes the table) is found
        let parent = table_head;
        let parent_found = false;
        while (!parent.querySelector("table")) {
            parent = parent.parentElement;
            if (parent.querySelector("table")) parent_found = true;
        }
        if (!parent_found) return null;

        const table = parent.querySelector("table").querySelectorAll("tbody")[1];
        return Array.from(table.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim()));
    });

    const single_federal_income_tax_map = {};
    single_federal_income_tax.forEach((row) => {
        let percentage = Number(row[0].replaceAll(/[$%,]/g, ""));
        let lower_bound = Number(row[1].replaceAll(/[$%,]/g, ""));
        let upper_bound = Number(row[2].replaceAll(/[$%,]/g, ""));
        if (Number.isNaN(upper_bound)) upper_bound = Infinity;
        single_federal_income_tax_map[[lower_bound, upper_bound]] = percentage;
    });
    const married_federal_income_tax_map = {};
    married_federal_income_tax.forEach((row) => {
        let percentage = Number(row[0].replaceAll(/[$%,]/g, ""));
        let lower_bound = Number(row[1].replaceAll(/[$%,]/g, ""));
        let upper_bound = Number(row[2].replaceAll(/[$%,]/g, ""));
        if (Number.isNaN(upper_bound)) upper_bound = Infinity;
        married_federal_income_tax_map[[lower_bound, upper_bound]] = percentage;
    });

    await browser.close();

    return [single_federal_income_tax_map, married_federal_income_tax_map];
}

async function scrape_standard_deductions() {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.irs.gov/publications/p17", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table");

    const standard_deductions = await page.evaluate(() => {
        const table_head = Array.from(document.querySelectorAll("p")).find((t) =>
            t.innerText.toLowerCase().includes("table 10-1.standard deduction chart for most people")
        );
        if (!table_head) return null;

        let surrounding_div = table_head;
        let div_found = false;
        while (!surrounding_div.querySelector("table")) {
            surrounding_div = surrounding_div.nextElementSibling;
            if (surrounding_div.querySelector("table")) div_found = true;
        }
        if (!div_found) return "not found";

        const table = Array.from(surrounding_div.querySelector("table").querySelector("tbody").querySelectorAll("tr")).slice(1, 3);
        return table.map((row) => Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim()));
    });

    let single_standard_deductions = 0;
    let married_standard_deductions = 0;
    Array.from(standard_deductions).forEach((element) => {
        if (element[0].toLowerCase().includes("single")) {
            single_standard_deductions = Number(element[1].trim().replaceAll(/[$%,]/g, ""));
        } else if (element[0].toLowerCase().includes("married filing jointly")) {
            married_standard_deductions = Number(element[1].trim().replaceAll(/[$%,]/g, ""));
        }
    });

    await browser.close();

    return [single_standard_deductions, married_standard_deductions];
}

async function scrape_capital_gains_tax() {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.irs.gov/taxtopics/tc409", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("div");

    const capital_gains_taxes = await page.evaluate(() => {
        const tax_rate_paragraphs = Array.from(document.querySelectorAll("p")).filter((p) => p.innerText.toLowerCase().includes("a capital gains rate of"));
        // const heading = Array.from(document.querySelectorAll("h2")).find((h) => h.innerText.toLowerCase().includes("capital gains tax rates"));
        console.log(tax_rate_paragraphs);
        const items = {};
        let max_single_bound = 0; // used for the highest capital gains tax bracket
        let max_married_bound = 0;
        tax_rate_paragraphs.forEach((rate) => {
            // extract rate from paragraph element
            const line = rate.innerText.toLowerCase().match(/a capital gains rate of\s+\d+\s*%/i)[0];
            const rate_extracted = Number(line.match(/\d+/)[0]);
            if (rate.nextElementSibling.matches("ul") || rate.nextElementSibling.matches("ol")) {
                const brackets = Array.from(rate.nextElementSibling.querySelectorAll("li"));
                brackets.forEach((bracket) => {
                    // find dollar bounds for the tax bracket
                    const bracket_text = bracket.innerText.trim().toLowerCase();
                    let amount = bracket_text.indexOf("$");
                    let bounds = [];
                    while (amount !== -1) {
                        const next_space = bracket_text.indexOf(" ", amount);
                        const bound = Number(bracket_text.slice(amount, next_space).replaceAll(/[$,]/g, "")); // find bound by finding occurrence of $ and the closest space
                        bounds.push(bound);
                        amount = bracket_text.indexOf("$", next_space);
                    }

                    if (bounds.length === 1) {
                        bounds = [0, ...bounds];
                    } else {
                        bounds[0] += 1; // add 1 to lower bound to avoid double counting for all elements but the first tax bracket
                    }
                    if (bracket_text.includes("single")) {
                        // determine if single or married filing jointly
                        items[["single", ...bounds]] = rate_extracted;
                        max_single_bound = Math.max(max_single_bound, Math.max(...bounds));
                    } else if (bracket_text.includes("married filing jointly")) {
                        items[["married", ...bounds]] = rate_extracted;
                        max_married_bound = Math.max(max_married_bound, Math.max(...bounds));
                    }
                });
            } else {
                items[Infinity] = rate_extracted; // highest tax rate will not have a list element - just set to Infinity and calculate later
            }
        });

        const highest_tax_bracket = items[Infinity];
        delete items[Infinity];
        items[["single", max_single_bound + 1, Infinity]] = highest_tax_bracket;
        items[["married", max_married_bound + 1, Infinity]] = highest_tax_bracket;

        return items;
    });

    // separate capital gains tax into single and married status
    const single_capital_gains_taxes = {};
    const married_capital_gains_taxes = {};
    Object.keys(capital_gains_taxes).forEach((key) => {
        const status = key.split(",")[0];
        const lower_bound = key.split(",")[1];
        const upper_bound = key.split(",")[2];
        if (status === "single") {
            single_capital_gains_taxes[[lower_bound, upper_bound]] = capital_gains_taxes[key];
        } else if (status === "married") {
            married_capital_gains_taxes[[lower_bound, upper_bound]] = capital_gains_taxes[key];
        }
    });

    await browser.close();

    return [single_capital_gains_taxes, married_capital_gains_taxes];
}

async function checkMissingTaxData(year) {
    const taxData = await Taxes.findOne({ year });
    if (!taxData) {
        // if no data at all for current year --> all fields missing
        return {
            single_federal_income_tax: true,
            married_federal_income_tax: true,
            single_standard_deductions: true,
            married_standard_deductions: true,
            single_capital_gains_tax: true,
            married_capital_gains_tax: true,
        };
    }

    // if an object is returned, check the various fields for any missing data
    return {
        single_federal_income_tax: !taxData.single_federal_income_tax,
        married_federal_income_tax: !taxData.married_federal_income_tax,
        single_standard_deductions: !taxData.single_standard_deductions,
        married_standard_deductions: !taxData.married_standard_deductions,
        single_capital_gains_tax: !taxData.single_capital_gains_tax,
        married_capital_gains_tax: !taxData.married_capital_gains_tax,
    };
}

async function scrape_and_store_taxes() {
    const year = 2024;
    const missingData = await checkMissingTaxData(year);

    // check federal income tax for missing data and scrape if necessary
    let single_federal_income_tax, married_federal_income_tax;
    if (missingData.single_federal_income_tax || missingData.married_federal_income_tax) {
        const federal_income_tax_maps = await scrape_federal_income_taxes();
        if (missingData.single_federal_income_tax) single_federal_income_tax = federal_income_tax_maps[0];
        if (missingData.married_federal_income_tax) married_federal_income_tax = federal_income_tax_maps[1];
    }

    // check standard deductions tax
    let single_standard_deductions, married_standard_deductions;
    if (missingData.single_standard_deductions || missingData.married_standard_deductions) {
        const standard_deductions = await scrape_standard_deductions();
        if (missingData.single_standard_deductions) single_standard_deductions = standard_deductions[0];
        if (missingData.married_standard_deductions) married_standard_deductions = standard_deductions[1];
    }

    // check capital gains tax
    let single_capital_gains_tax, married_capital_gains_tax;
    if (missingData.single_capital_gains_tax || missingData.married_capital_gains_tax) {
        const capital_gains_taxes = await scrape_capital_gains_tax();
        if (missingData.single_capital_gains_tax) single_capital_gains_tax = capital_gains_taxes[0];
        if (missingData.married_capital_gains_tax) married_capital_gains_tax = capital_gains_taxes[1];
    }

    // create object with updated data fields to be stored into the database
    const updateData = {};
    if (single_federal_income_tax) updateData.single_federal_income_tax = single_federal_income_tax;
    if (married_federal_income_tax) updateData.married_federal_income_tax = married_federal_income_tax;
    if (single_standard_deductions) updateData.single_standard_deductions = single_standard_deductions;
    if (married_standard_deductions) updateData.married_standard_deductions = married_standard_deductions;
    if (single_capital_gains_tax) updateData.single_capital_gains_tax = single_capital_gains_tax;
    if (married_capital_gains_tax) updateData.married_capital_gains_tax = married_capital_gains_tax;

    if (Object.keys(updateData).length > 0) {
        // update database with new data or initialize it if needed
        await Taxes.updateOne({ year }, { $set: updateData }, { upsert: true });
        console.log("Taxes updated");
    } else {
        console.log("All tax data is already present for the year", year);
    }

    if (db) db.close(); // Close the database connection
}

scrape_and_store_taxes().catch((error) => {
    console.error("ERROR: " + error);
    if (db) db.close();
});
