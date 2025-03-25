const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
require("./passport/passport");
const passport = require("passport");
const configs = require("./configs/config.js");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
//
const { spawn } = require("child_process"); // Import child_process

const session = require("express-session");
const MongoStore = require("connect-mongo");
const { v4: genuuid } = require("uuid");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
// mongoose.connect(mongodb);

mongoose.connect(configs.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));
db.once("open", () => console.log("Connected to MongoDB"));

// add express-session middleware
const sessionStore = MongoStore.create({
    mongoUrl: configs.dbURL,
});

sessionStore.on("error", (error) => {
    console.error("Session store error:", error);
});

app.use(
    session({
        secret: (req) => req.session.secret || genuuid(), // if no Google auth token, then generate a random ID
        resave: false, // prevent resaving session if nothing has changed
        saveUninitialized: false, // prevent saving uninitialized sessions
        store: sessionStore,
        cookie: {
            maxAge: 60 * 60 * 1000, // 1 hour
        },
    })
);

// dynamically set the session secret when Google authentication is triggered
// app.use((req, res, next) => {
//     if (req.session && req.session.googleToken) {
//         req.session.secret = req.session.googleToken;
//     }
//     next();
// });

// app.use((req, res, next) => {
//     console.log("Session data:", req.session);
//     next();
// });

app.use(passport.initialize());
app.use(passport.session());
// Auth routes
// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
app.use("/auth", require("./routes/auth"));
//

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
