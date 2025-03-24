const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { spawn } = require("child_process"); // Import child_process

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
mongoose.connect(mongodb);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

// spawn tax_scraper.js as separate process
const taxScraperProcess = spawn("node", ["federal_tax_scraper.js"]);
taxScraperProcess.stdout.on("data", (data) => {
    console.log(`tax_scraper.js: ${data}`);
});
taxScraperProcess.stderr.on("data", (data) => {
    console.error(`tax_scraper.js error: ${data}`);
});
taxScraperProcess.on("close", (code) => {
    console.log(`tax_scraper.js process exited with code ${code}`);
});

// spawn parse_state_yaml_file.js as separate process
const parseStateYamlProcess = spawn("node", ["parse_state_yaml_file.js"]);
parseStateYamlProcess.stdout.on("data", (data) => {
    console.log(`parse_state_yaml_file.js: ${data}`);
});
parseStateYamlProcess.stderr.on("data", (data) => {
    console.error(`parse_state_yaml_file.js error: ${data}`);
});
parseStateYamlProcess.on("close", (code) => {
    console.log(`parse_state_yaml_file.js process exited with code ${code}`);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
    try {
        if (db) {
            await db.close(); // Wait for the database connection to close
            console.log("Database connection closed");
        }
    } catch (error) {
        console.error("Error closing database connection:", error);
    } finally {
        console.log("Process terminated");
        process.exit(0); // Explicitly exit the process
    }
});
