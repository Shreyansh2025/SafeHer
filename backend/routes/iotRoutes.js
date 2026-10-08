const express = require("express");
const router = express.Router();

const { triggerIotSOS } = require("../controllers/iotController");

router.post("/sos", triggerIotSOS);

module.exports = router;