const express = require("express");

const router = express.Router();

const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");


// All profile routes require authentication
router.use(authMiddleware);


// GET PROFILE
router.get("/", profileController.getProfile);


// UPDATE PROFILE
router.put("/", profileController.updateProfile);


// DELETE PROFILE
router.delete("/", profileController.deleteProfile);


module.exports = router;