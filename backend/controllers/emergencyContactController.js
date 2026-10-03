const emergencyContactService =
    require("../services/emergencyContactService");


// =========================================================
// CREATE CONTACT
// =========================================================

const createEmergencyContact = async (req, res) => {
    try {
        const {
            name,
            phone,
            relation
        } = req.body;

        const userId = req.user.id;

        const contact =
            await emergencyContactService
                .createEmergencyContactService({
                    userId,
                    name,
                    phone,
                    relation
                });

        return res.status(201).json({
            success: true,
            message:
                "Emergency contact created successfully",
            data: contact
        });

    } catch (error) {
        console.error(
            "Create emergency contact error:",
            error
        );

        return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode
            ? error.message
            : "Internal server error"
    });
    }
};


// =========================================================
// GET ALL CONTACTS
// =========================================================

const getAllEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user.id;

        const contacts =
            await emergencyContactService
                .getAllEmergencyContactsService(
                    userId
                );

        return res.status(200).json({
            success: true,
            message:
                "Emergency contacts fetched successfully",
            data: contacts
        });

    } catch (error) {
        console.error(
            "Get contacts error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch emergency contacts"
        });
    }
};


// =========================================================
// GET CONTACT BY ID
// =========================================================

const getEmergencyContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const contact =
            await emergencyContactService
                .getEmergencyContactByIdService(
                    id,
                    userId
                );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Emergency contact not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Emergency contact fetched successfully",
            data: contact
        });

    } catch (error) {
        console.error(
            "Get contact error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch emergency contact"
        });
    }
};


// =========================================================
// UPDATE CONTACT
// =========================================================

const updateEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const {
            name,
            phone,
            relation
        } = req.body;

        const contact =
            await emergencyContactService
                .updateEmergencyContactService(
                    id,
                    userId,
                    {
                        name,
                        phone,
                        relation
                    }
                );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Emergency contact not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Emergency contact updated successfully",
            data: contact
        });

    } catch (error) {
        console.error(
            "Update contact error:",
            error
        );

        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.statusCode
              ? error.message
              : "Internal server error"
      });
    }
};


// =========================================================
// DELETE CONTACT
// =========================================================

const deleteEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const contact =
            await emergencyContactService
                .deleteEmergencyContactService(
                    id,
                    userId
                );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Emergency contact not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Emergency contact deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete contact error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete emergency contact"
        });
    }
};


// =========================================================
// EXPORT CONTROLLER FUNCTIONS
// =========================================================

module.exports = {
    createEmergencyContact,
    getAllEmergencyContacts,
    getEmergencyContactById,
    updateEmergencyContact,
    deleteEmergencyContact
};