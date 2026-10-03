const express = require("express");

const router = express.Router();

const {
    createEmergencyContact,
    getAllEmergencyContacts,
    getEmergencyContactById,
    updateEmergencyContact,
    deleteEmergencyContact
} = require("../controllers/emergencyContactController");

const authMiddleware =
    require("../middleware/authMiddleware");


router.use(authMiddleware);


router.post(
    "/",
    createEmergencyContact
);

router.get(
    "/",
    getAllEmergencyContacts
);

router.get(
    "/:id",
    getEmergencyContactById
);

router.put(
    "/:id",
    updateEmergencyContact
);

router.delete(
    "/:id",
    deleteEmergencyContact
);


module.exports = router;