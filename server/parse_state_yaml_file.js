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
        for (const status in taxData) {
            parsedData[status] = {};
            parsedData[status] = taxData[status].brackets.map((bracket) => ({
                range: bracket.range,
                rate: Number(bracket.rate),
                adjustment: Number(bracket.adjustment) || 0,
                excess_over: Number(bracket.excess_over) || 0,
            }));
        }

        return parsedData;
    } catch (error) {
        console.error("Error parsing tax data:", error);
        return null;
    }
}

async function store_tax_data(data, state) {
    const parsed_data = JSON.parse(data);
    const state_taxes = new StateTaxes({
        year: 2024,
        state: state,
        single_tax_brackets: parsed_data["single"] || null,
        married_tax_brackets: parsed_data["married"] || null,
    });
    await state_taxes.save();
}

async function parse_and_store_yaml_data(filePath, state) {
    const stateTaxDataExists = await StateTaxes.exists({ year: 2024, state: state });
    if (stateTaxDataExists) {
        return; // if state tax data is already stored in the database --> don't store again
    }
    const taxData = await read_tax_data_from_yaml(filePath);
    if (taxData) {
        await store_tax_data(JSON.stringify(taxData, null, 2), state);
    }
    if (db) db.close();
}

const filePath = process.argv[2] || "yaml/init.yaml";
const state = process.argv[3];
parse_and_store_yaml_data(filePath, state).catch((error) => {
    console.error("ERROR: " + error);
    if (db) db.close();
});
