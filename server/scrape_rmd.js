const RMD = require("./models/RMD.js");
const puppeteer = require("puppeteer-extra");
const mongoose = require("mongoose");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const configs = require("./configs/config.js");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(configs.dbURL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

async function scrapeRMDs() {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(configs.rmdURL, {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table");

    const rmd_table = await page.evaluate(() => {
        const table = Array.from(document.querySelectorAll("table")).find((t) => t.innerText.includes("Uniform Lifetime"));
        if (!table) return null;
        let rows = Array.from(table.querySelectorAll("tr"));
        let index = 0;
        while (index < rows.length && !rows[index].innerText.toLowerCase().includes("distribution period")) {
            index++;
        }
        rows = rows.slice(index + 1, rows.length - 1);

        let elements = {};
        rows.forEach((row) => {
            const cells = Array.from(row.querySelectorAll("td"));
            if (cells.length == 4) {
                elements[Number(cells[0]?.innerText.split(/\s+/)[0])] = Number(cells[1]?.innerText);
                elements[Number(cells[2]?.innerText.split(/\s+/)[0])] = Number(cells[3]?.innerText);
            } else {
                elements[Number(cells[0]?.innerText.split(/\s+/)[0])] = Number(cells[1]?.innerText);
            }
        });

        return elements;
    });

    await browser.close();

    return rmd_table;
}

async function checkMissingRMDs(year) {
    const rmds = await RMD.findOne({ year: year });
    if (!rmds) {
        console.log("RMDs not stored for year " + year);
        return false;
    }
    return true;
}

async function storeRMDs() {
    const year = 2024;
    const rmds_exist = await checkMissingRMDs(year);
    if (!rmds_exist) {
        const rmds = await scrapeRMDs();
        const rmds_to_store = new RMD({
            year: year,
            distributions: rmds,
        });
        await rmds_to_store.save();
    } else {
        console.log("RMDs already stored for year " + year);
    }
    if (db) db.close();
}

storeRMDs().catch((error) => {
    console.error("ERROR: " + error);
    if (db) db.close();
});
