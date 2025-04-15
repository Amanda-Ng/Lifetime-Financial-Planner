const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const router = express.Router();

// Multer config for temporary uploads
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("stateTaxYaml"), (req, res) => {
    const filePath = path.resolve(req.file.path);

    const parseProcess = spawn("node", ["parse_state_yaml_file.js", filePath]);

    parseProcess.stdout.on("data", (data) => {
        console.log(`Parser Output: ${data}`);
    });

    parseProcess.stderr.on("data", (data) => {
        console.error(`Parser Error: ${data}`);
    });

    parseProcess.on("close", (code) => {
        if (code === 0) {
            res.status(200).json({ message: "State tax YAML parsed and stored successfully." });
        } else {
            res.status(500).json({ error: "Failed to parse and store YAML file." });
        }
    });
});

module.exports = router;
