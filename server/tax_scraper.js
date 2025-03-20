const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function run() {
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
        const table_head = Array.from(document.querySelectorAll("h2")).find(
            (t) => t.innerHTML.toLowerCase().includes("single")
        );
        if (!table_head) return null;
        let table = table_head.nextElementSibling;
        while (!table.matches(".table")) {
            table = table.nextElementSibling;
        }
        return Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("td, th")).map((cell) =>
                cell.innerText.trim()
            )
        );
    });

    const married_federal_income_tax = await page.evaluate(() => {
        const table = Array.from(document.querySelectorAll("h2")).find((t) =>
            t.innerText.toLowerCase().includes("married filing jointly")
        );
        if (!table) return null;
        return Array.from(table.querySelectorAll("tr")).map((row) =>
            Array.from(row.querySelectorAll("td, th")).map((cell) =>
                cell.innerText.trim()
            )
        );
    });

    console.log("Single Federal Income Tax", single_federal_income_tax);
    console.log("Married Federal Income Tax", married_federal_income_tax);

    await browser.close();
}

run();
