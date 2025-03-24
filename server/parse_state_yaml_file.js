const fs = require("fs").promises;
const yaml = require("js-yaml");

async function parseTaxData(filePath) {
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

async function writeTaxDataToFile(data, outputPath) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        await fs.writeFile(outputPath, jsonData, "utf8");
        console.log(`Tax data successfully written to ${outputPath}`);
    } catch (error) {
        console.error("Error writing tax data to file:", error);
    }
}

(async () => {
    const taxData = await parseTaxData("init.yaml");
    if (taxData) {
        await writeTaxDataToFile(taxData, "parsed_tax_data.txt");
    }
})();
