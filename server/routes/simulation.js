const express = require("express");
const { Worker } = require("worker_threads");
const path = require("path");
const router = express.Router();
const { runSimulation } = require("../simulations/simulate");
const Scenario = require("../models/Scenario");
const User = require("../models/User");

function runWorker(scenario, age, username) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, "../simulations/simulationWorker.js"), {
            workerData: { scenario, age, username },
        });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

router.post("/runSimulation", async (req, res) => {
    const { scenarioId, username, numSimulations } = req.body;

    try {
        const scenario = await Scenario.findById(scenarioId)
            .populate({
                path: "investments",
                populate: {
                    path: "investmentType",
                },
            })
            .populate("event_series")
            .populate("spending_strategy")
            .populate("expense_withdrawal_strategy")
            .populate("roth_conversion_strategy")
            .populate("rmd_strategy")
            .populate("sharedUser")
            .lean();

        if (!scenario) {
            return res.status(404).json({ message: "Scenario not found" });
        }

        const user = await User.findOne({ username }).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentYear = new Date().getFullYear();
        const age = currentYear - scenario.birth_year;

        const workers = Array.from({ length: numSimulations }, () =>
            runWorker(scenario, age, username)
        );

        const results = await Promise.all(workers);
        return res.status(200).json({ message: "Simulations complete", results });
    } catch (error) {
        console.error("Simulation error:", error);
        res.status(500).send("Simulation failed");
    }
});

module.exports = router;
