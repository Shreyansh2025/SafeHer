const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateUserQR } = require("./qrService");

// GET PROFILE
const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ["id", "name", "email", "phone", "role"]
    });

    if (!user) {
        throw new Error("User not found");
    }
    const qrCode = await generateUserQR(user);

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        qrCode: qrCode
    };
};


// UPDATE PROFILE
const updateProfile = async (userId, data) => {
    const { name, phone, email, password } = data;

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // Update email
    if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            throw new Error("Email cannot be empty");
        }

        const existingUser = await User.findOne({
            where: {
                email: normalizedEmail,
                id: {
                    [Op.ne]: userId
                }
            }
        });

        if (existingUser) {
            throw new Error("Email already exists");
        }

        user.email = normalizedEmail;
    }

    // Update name
    if (name !== undefined) {
        const normalizedName = name.trim();

        if (!normalizedName) {
            throw new Error("Name cannot be empty");
        }

        user.name = normalizedName;
    }

    // Update phone
    if (phone !== undefined) {
        const normalizedPhone = phone.trim();

        if (!normalizedPhone) {
            throw new Error("Phone cannot be empty");
        }

        const existingPhone = await User.findOne({
            where: {
                phone: normalizedPhone,
                id: {
                    [Op.ne]: userId
                }
            }
        });

        if (existingPhone) {
            throw new Error("Phone already exists");
        }

        user.phone = normalizedPhone;
    }

    // Update password
    if (password !== undefined) {
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const qrCode = await generateUserQR(user);
    
    // IMPORTANT: Never return password hash
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        qrCode: qrCode
    };
};


// DELETE PROFILE
const deleteProfile = async (userId) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("User not found");
    }

    await user.destroy();

    return true;
};


module.exports = {
    getProfile,
    updateProfile,
    deleteProfile
};