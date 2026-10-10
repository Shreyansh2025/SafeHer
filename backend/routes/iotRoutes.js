
const express = require("express");
const router = express.Router();

const {
  triggerIotSOS,
  getIotSOSStatus,
} = require("../controllers/iotController");

router.post("/sos", triggerIotSOS);
router.get("/status", getIotSOSStatus);

module.exports = router;
