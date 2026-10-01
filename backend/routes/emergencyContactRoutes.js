const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {createEmergencyContact,getAllEmergencyContacts,getEmergencyContactById,updateEmergencyContact,deleteEmergencyContact} = require("../controllers/emergencyContactController");

// All routes require authentication
router.use(authMiddleware);

// CREATE
router.post("/", createEmergencyContact);
//get
router.get("/", getAllEmergencyContacts);
//get by id
router.get("/:id", getEmergencyContactById);
//update
router.put("/:id",updateEmergencyContact)
//delete
router.delete("/:id",deleteEmergencyContact)

module.exports = router;