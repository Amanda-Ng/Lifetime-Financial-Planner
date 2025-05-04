const { parentPort, workerData } = require("worker_threads");
const { runSimulation } = require("./simulate");

(async () => {
    try {
        const { yearlyInvestments, yearlyData, yearlyBreakdown } = await runSimulation(workerData.scenario, workerData.age, workerData.username);
        parentPort.postMessage({ status: "done", yearlyInvestments, yearlyData, yearlyBreakdown });
    } catch (err) {
        console.error("Error in simulation worker:", err);
        parentPort.postMessage({ status: "error", error: err.message });
    }
})();
