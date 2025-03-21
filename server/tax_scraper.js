const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function scrape_federal_income_taxes() {
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(
        "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets",
        {
            waitUntil: "domcontentloaded",
        }
    );

    await page.waitForSelector("table");

    const single_federal_income_tax = await page.evaluate(() => {
        // find heading of table
        const table_head = Array.from(document.querySelectorAll("h2")).find(
            (t) => t.innerHTML.toLowerCase().includes("single")
        );
        if (!table_head) return null;

        // traverse HTML to find sibling element that is the table corresponding to the heading
        let table = table_head;
        let found_table = false;
        while (!table.matches("table")) {
            table = table.nextElementSibling;
            if (table.matches("table")) found_table = true;
        }
        if (!found_table) return null; // ensure that table was found

        return Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("td")).map((cell) =>
                cell.innerText.trim()
            )
        );
    });

    const married_federal_income_tax = await page.evaluate(() => {
        const table_head = Array.from(document.querySelectorAll("h4")).find(
            (t) => t.innerText.toLowerCase().includes("married filing jointly")
        );
        if (!table_head) return null;

        // go back up until overarching parent element (that includes the table) is found
        let parent = table_head;
        let parent_found = false;
        while (!parent.querySelector("table")) {
            parent = parent.parentElement;
            if (parent.querySelector("table")) parent_found = true;
        }
        if (!parent_found) return null;

        // now found the table element with querySelector
        const table = parent.querySelector("table");
        return Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("td")).map((cell) =>
                cell.innerText.trim()
            )
        );
    });

    console.log("Single Federal Income Tax", single_federal_income_tax);
    console.log("Married Federal Income Tax", married_federal_income_tax);

    await browser.close();
}

async function scrape_standard_deductions() {
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.irs.gov/publications/p17", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table");

    const standard_deductions = await page.evaluate(() => {
        const table_head = Array.from(document.querySelectorAll("p")).find(
            (t) =>
                t.innerText
                    .toLowerCase()
                    .includes(
                        "table 10-1.standard deduction chart for most people"
                    )
        );
        if (!table_head) return null;

        let surrounding_div = table_head;
        let div_found = false;
        while (!surrounding_div.querySelector("table")) {
            surrounding_div = surrounding_div.nextElementSibling;
            if (surrounding_div.querySelector("table")) div_found = true;
        }
        if (!div_found) return "not found";

        const table = surrounding_div.querySelector("table");
        return Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("td")).map((cell) =>
                cell.innerText.trim()
            )
        );
    });

    console.log("Standard Deductions Post 1960", standard_deductions);

    await browser.close();
}

async function scrape_capital_gains_tax() {
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://www.irs.gov/taxtopics/tc409", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("div");

    const capital_gains_taxes = await page.evaluate(() => {
        const heading = Array.from(document.querySelectorAll("h2")).find((h) =>
            h.innerText.toLowerCase().includes("capital gains tax rates")
        );

        let items = [];
        let body_contents = heading;
        while (
            !body_contents.innerText
                .toLowerCase()
                .includes("limit on the deduction and carryover of losses")
        ) {
            if (body_contents.matches("p")) {
                // console.log("Tax rate");
                // console.log(body_contents.innerText.trim());
                items.push(body_contents.innerText.trim());
            } else if (
                body_contents.matches("ul") ||
                body_contents.matches("ol")
            ) {
                console.log("Amounts");
                let amounts = Array.from(
                    body_contents.querySelectorAll("li")
                ).map((li) => li.innerText.trim());
                items.push(amounts);
            }
            body_contents = body_contents.nextElementSibling;
        }

        return items;
    });

    console.log("Capital Gains Taxes", capital_gains_taxes);

    await browser.close();
}

scrape_federal_income_taxes();
scrape_standard_deductions();
scrape_capital_gains_tax();
