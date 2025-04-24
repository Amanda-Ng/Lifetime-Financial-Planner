const { parentPort, workerData } = require("worker_threads");
const { runSimulation } = require("./simulate");

(async () => {
    try {
        await runSimulation(workerData.scenario, workerData.age, workerData.username);
        parentPort.postMessage({ status: "done" });
    } catch (err) {
        parentPort.postMessage({ status: "error", error: err.message });
    }
})();
