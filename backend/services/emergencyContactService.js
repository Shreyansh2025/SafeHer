const { Op } = require("sequelize");
const EmergencyContact = require("../models/EmergencyContact");


// =========================================================
// PHONE NORMALIZATION
// =========================================================

const normalizePhone = (phone) => {
    if (phone === undefined || phone === null) {
        throw new Error("Phone number is required");
    }

    // Keep digits only
    let value = String(phone)
        .trim()
        .replace(/\D/g, "");

    // +91XXXXXXXXXX / 91XXXXXXXXXX
    if (value.startsWith("91") && value.length === 12) {
        value = value.slice(2);
    }

    // 0XXXXXXXXXX
    if (value.startsWith("0") && value.length === 11) {
        value = value.slice(1);
    }

    // Indian 10-digit mobile number
    if (!/^[6-9]\d{9}$/.test(value)) {
        throw new Error("Invalid phone number");
    }

    return value;
};


// =========================================================
// DATABASE PHONE FORMAT
// =========================================================

const toDatabasePhone = (phone) => {
    return `+91${phone}`;
};


// =========================================================
// TEXT NORMALIZATION
// =========================================================

const normalizeText = (value, field) => {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(`${field} is required`);
    }

    return String(value).trim();
};


// =========================================================
// CREATE CONTACT
// =========================================================

const createEmergencyContactService = async ({
    userId,
    name,
    phone,
    relation
}) => {

    const cleanName =
        normalizeText(name, "Name");

    const cleanRelation =
        normalizeText(relation, "Relation");

    const normalizedPhone =
        normalizePhone(phone);

    const databasePhone =
        toDatabasePhone(normalizedPhone);


    // ---------------------------------------------------------
    // CHECK EXISTING CONTACTS
    //
    // IMPORTANT:
    // Existing database data may contain:
    //
    // 9876543210
    // +919876543210
    // 919876543210
    // 09876543210
    //
    // So we normalize the EXISTING values too.
    // ---------------------------------------------------------

    const existingContacts =
        await EmergencyContact.findAll({
            where: {
                userId
            },
            attributes: [
                "id",
                "phone"
            ]
        });


    const duplicate =
        existingContacts.some((contact) => {

            try {

                const existingNormalizedPhone =
                    normalizePhone(contact.phone);

                return (
                    existingNormalizedPhone ===
                    normalizedPhone
                );

            } catch {

                return false;
            }
        });


    if (duplicate) {

        const error = new Error(
            "This phone number is already an emergency contact"
        );

        error.statusCode = 409;

        throw error;
    }


    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------

    try {

        const contact =
            await EmergencyContact.create({
                userId,
                name: cleanName,
                phone: databasePhone,
                relation: cleanRelation
            });

        return contact;

    } catch (error) {

        // Database unique constraint
        if (
            error.name ===
            "SequelizeUniqueConstraintError"
        ) {

            const duplicateError =
                new Error(
                    "This phone number is already an emergency contact"
                );

            duplicateError.statusCode = 409;

            throw duplicateError;
        }

        throw error;
    }
};


// =========================================================
// GET ALL
// =========================================================

const getAllEmergencyContactsService = async (
    userId
) => {

    return await EmergencyContact.findAll({
        where: {
            userId
        },
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


// =========================================================
// GET BY ID
// =========================================================

const getEmergencyContactByIdService = async (
    id,
    userId
) => {

    return await EmergencyContact.findOne({
        where: {
            id,
            userId
        }
    });
};


// =========================================================
// UPDATE
// =========================================================

const updateEmergencyContactService = async (
    id,
    userId,
    data
) => {

    const {
        name,
        phone,
        relation
    } = data;


    // ---------------------------------------------------------
    // FIND CONTACT OWNED BY USER
    // ---------------------------------------------------------

    const contact =
        await EmergencyContact.findOne({
            where: {
                id,
                userId
            }
        });


    if (!contact) {
        return null;
    }


    const cleanName =
        normalizeText(name, "Name");

    const cleanRelation =
        normalizeText(relation, "Relation");

    const normalizedPhone =
        normalizePhone(phone);

    const databasePhone =
        toDatabasePhone(normalizedPhone);


    // ---------------------------------------------------------
    // CHECK OTHER CONTACTS
    // ---------------------------------------------------------

    const existingContacts =
        await EmergencyContact.findAll({
            where: {
                userId,
                id: {
                    [Op.ne]: id
                }
            },
            attributes: [
                "id",
                "phone"
            ]
        });


    const duplicate =
        existingContacts.some((existingContact) => {

            try {

                const existingNormalizedPhone =
                    normalizePhone(
                        existingContact.phone
                    );

                return (
                    existingNormalizedPhone ===
                    normalizedPhone
                );

            } catch {

                return false;
            }
        });


    if (duplicate) {

        const error = new Error(
            "This phone number is already an emergency contact"
        );

        error.statusCode = 409;

        throw error;
    }


    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------

    try {

        await contact.update({
            name: cleanName,
            phone: databasePhone,
            relation: cleanRelation
        });

        return contact;

    } catch (error) {

        if (
            error.name ===
            "SequelizeUniqueConstraintError"
        ) {

            const duplicateError =
                new Error(
                    "This phone number is already an emergency contact"
                );

            duplicateError.statusCode = 409;

            throw duplicateError;
        }

        throw error;
    }
};


// =========================================================
// DELETE
// =========================================================

const deleteEmergencyContactService = async (
    id,
    userId
) => {

    const contact =
        await EmergencyContact.findOne({
            where: {
                id,
                userId
            }
        });


    if (!contact) {
        return null;
    }


    await contact.destroy();

    return contact;
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    createEmergencyContactService,
    getAllEmergencyContactsService,
    getEmergencyContactByIdService,
    updateEmergencyContactService,
    deleteEmergencyContactService
};