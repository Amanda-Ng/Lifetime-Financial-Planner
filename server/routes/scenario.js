const router = require("express").Router();
const { verifyToken } = require("../middlewares/jwt");
const { exportScenarioToYAML } = require("../controllers/exportController");

router.get("/export/:id", verifyToken, exportScenarioToYAML);

module.exports = router;
