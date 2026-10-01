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
const getAllEmergencyContactsService = async (userId) => {
  const contacts = await EmergencyContact.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });

  return contacts;
};

// GET CONTACT BY ID
const getEmergencyContactByIdService = async (id, userId) => {
  const contact = await EmergencyContact.findOne({
    where: { id, userId }
  });

  return contact;
};


// UPDATE
const updateEmergencyContactService = async (id, userId, data) => {
  const contact = await EmergencyContact.findOne({
    where: { id, userId }
  });

  if (!contact) {
    return null;
  }

  await contact.update(data);

  return contact;
};

// DELETE
const deleteEmergencyContactService = async (id, userId) => {
  const contact = await EmergencyContact.findOne({
    where: { id, userId }
  });

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