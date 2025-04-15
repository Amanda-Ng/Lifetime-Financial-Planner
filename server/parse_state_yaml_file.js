const fs = require("fs").promises;
const yaml = require("js-yaml");

const mongoose = require("mongoose");
const StateTaxes = require("./models/StateTaxes");

const configs = require("./configs/config.js");
const dotenv = require("dotenv");
dotenv.config();

const mongodb = configs.dbURL;
mongoose.connect(mongodb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

async function read_tax_data_from_yaml(filePath) {
    try {
        const fileContents = await fs.readFile(filePath, "utf8");
        const taxData = yaml.load(fileContents); // load yaml file as JS object

        const parsedData = {};
        // parse data into JSON format
        for (const state in taxData) {
            parsedData[state] = {};
            for (const status in taxData[state]) {
                parsedData[state][status] = taxData[state][status].brackets.map((bracket) => ({
                    range: bracket.range, // tax bracket range
                    rate: bracket.rate, // tax rate percentage
                    adjustment: bracket.adjustment || 0, // if no adjustment is provided, default to 0
                    excess_over: bracket.excess_over || 0, // excess amount to be converted with tax percentage - defaults to 0
                }));
            }
        }

        return parsedData;
    } catch (error) {
        console.error("Error parsing tax data:", error);
        return null;
    }
}

async function store_tax_data(data) {
    const parsed_data = JSON.parse(data);
    for (const state in parsed_data) {
        const filing_statuses = parsed_data[state];
        const state_taxes = new StateTaxes({
            year: 2024,
            state: state,
            single_tax_brackets: filing_statuses["single"] || null,
            married_tax_brackets: filing_statuses["married"] || null,
        });
        await state_taxes.save();
    }
}

async function parse_and_store_yaml_data(filePath) {
    const taxData = await read_tax_data_from_yaml(filePath);
    if (taxData) {
        await store_tax_data(JSON.stringify(taxData, null, 2));
    }
    if (db) db.close();
}

parse_and_store_yaml_data("init.yaml").catch((error) => {
    console.error("ERROR: " + error);
    if (db) db.close();
});
