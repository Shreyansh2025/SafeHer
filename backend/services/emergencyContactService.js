const EmergencyContact = require("../models/EmergencyContact");

// CREATE
const createEmergencyContactService = async (data) => {
  const { userId, name, phone, relation } = data;

  const contact = await EmergencyContact.create({
    userId,
    name,
    phone,
    relation,
  });

  return contact;
};

// GET ALL
const getAllEmergencyContactsService = async () => {
  const contacts = await EmergencyContact.findAll({
    order: [["createdAt", "DESC"]],
  });

  return contacts;
};

// GET CONTACT BY ID
const getEmergencyContactByIdService = async (id) => {
  const contact = await EmergencyContact.findByPk(id);

  return contact;
};


// UPDATE
const updateEmergencyContactService = async (id, data) => {
  const contact = await EmergencyContact.findByPk(id);

  if (!contact) {
    return null;
  }

  await contact.update(data);

  return contact;
};

// DELETE
const deleteEmergencyContactService = async (id) => {
  const contact = await EmergencyContact.findByPk(id);

  if (!contact) {
    return null;
  }

  await contact.destroy();

  return contact;
};


module.exports = {
  createEmergencyContactService,
  getAllEmergencyContactsService,
  getEmergencyContactByIdService,
  updateEmergencyContactService,
  deleteEmergencyContactService
}