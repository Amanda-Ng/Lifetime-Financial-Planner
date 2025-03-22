const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

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
        single_federal_income_tax_map[["single", lower_bound, upper_bound]] = percentage;
    });
    const married_federal_income_tax_map = {};
    married_federal_income_tax.forEach((row) => {
        let percentage = Number(row[0].replaceAll(/[$%,]/g, ""));
        let lower_bound = Number(row[1].replaceAll(/[$%,]/g, ""));
        let upper_bound = Number(row[2].replaceAll(/[$%,]/g, ""));
        if (Number.isNaN(upper_bound)) upper_bound = Infinity;
        married_federal_income_tax_map[["married", lower_bound, upper_bound]] = percentage;
    });

    console.log("Single Federal Income Tax: ", single_federal_income_tax_map);
    console.log("Married Federal Income Tax: ", married_federal_income_tax_map);

    await browser.close();
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

    const standard_deductions_map = {};
    Array.from(standard_deductions).forEach((element) => {
        if (element[0].toLowerCase().includes("single")) {
            standard_deductions_map["single"] = Number(element[1].trim().replaceAll(/[$%,]/g, ""));
        } else if (element[0].toLowerCase().includes("married filing jointly")) {
            standard_deductions_map["married"] = Number(element[1].trim().replaceAll(/[$%,]/g, ""));
        }
    });
    console.log("Standard Deductions: ", standard_deductions_map);

    await browser.close();
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

    console.log("Capital Gains Taxes", capital_gains_taxes);

    await browser.close();
}

scrape_federal_income_taxes();
scrape_standard_deductions();
scrape_capital_gains_tax();
