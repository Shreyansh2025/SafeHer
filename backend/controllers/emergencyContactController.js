const emergencyContactService = require("../services/emergencyContactService");

// CREATE CONTACT
const createEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relation } = req.body;
    // Get userId from authenticated user token
    const userId = req.user.id;

    if (!name || !phone || !relation) {
      return res.status(400).json({
        success: false,
        message: "name, phone and relation are required",
      });
    }

    const contact =
      await emergencyContactService.createEmergencyContactService({
        userId,
        name,
        phone,
        relation,
      });

    return res.status(201).json({
      success: true,
      message: "Emergency contact created successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET ALL CONTACTS
const getAllEmergencyContacts = async (req, res) => {
  try {
    // Get userId from authenticated user token
    const userId = req.user.id;

    const contacts =
      await emergencyContactService.getAllEmergencyContactsService(userId);

    return res.status(200).json({
      success: true,
      message: "Emergency contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    console.error("Get contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET CONTACT BY ID
const getEmergencyContactById = async (req, res) => {
  try {
    const { id } = req.params;
    // Get userId from authenticated user token
    const userId = req.user.id;

    const contact =
      await emergencyContactService.getEmergencyContactByIdService(id, userId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact fetched successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Get contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// UPDATE CONTACT
const updateEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    // Get userId from authenticated user token
    const userId = req.user.id;

    const { name, phone, relation } = req.body;

    const updatedContact =
      await emergencyContactService.updateEmergencyContactService(id, userId, {
        name,
        phone,
        relation,
      });

    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error("Update contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// DELETE CONTACT
const deleteEmergencyContact = async (req, res) => {
  try {
    const { id } = req.params;
    // Get userId from authenticated user token
    const userId = req.user.id;

    const deletedContact =
      await emergencyContactService.deleteEmergencyContactService(id, userId);

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports={
    createEmergencyContact,
    getAllEmergencyContacts,
    getEmergencyContactById,
    updateEmergencyContact,
    deleteEmergencyContact

}