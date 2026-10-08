const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Op } = require("sequelize");

require("dotenv").config();


// REGISTER
const registerService = async (
    name,
    email,
    phone,
    password
) => {

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // =====================================================
    // ADMIN EMAIL PROTECTION
    // =====================================================

    const adminEmail = (process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();

    if (adminEmail && normalizedEmail === adminEmail) {
        throw new Error(
            "This email is reserved for admin use"
        );
    }

    // =====================================================
    // CHECK IF USER ALREADY EXISTS
    // =====================================================

    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { email: normalizedEmail },
                { phone: normalizedPhone }
            ]
        }
    });

    if (existingUser) {

        if (
            existingUser.email.trim().toLowerCase() ===
            normalizedEmail
        ) {
            throw new Error("Email already exists");
        }

        if (
            existingUser.phone.trim() ===
            normalizedPhone
        ) {
            throw new Error("Phone already exists");
        }
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    // =====================================================
    // CREATE USER
    // =====================================================

    const user = await User.create({
        name: name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        role: "USER"
    });

    // =====================================================
    // GENERATE JWT
    // =====================================================

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role
        },
        token
    };
};

// LOGIN
const loginService = async (email, password) => {

    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const adminEmail = (process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();

    // =====================================================
    // ADMIN EMAIL CANNOT USE NORMAL USER LOGIN
    // =====================================================

    if (
        adminEmail &&
        normalizedEmail === adminEmail
    ) {
        throw new Error(
            "Admin account must use the admin login"
        );
    }

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({
        where: {
            email: normalizedEmail
        }
    });

    if (!user) {
        throw new Error(
            "Invalid email or password"
        );
    }

    // =====================================================
    // EXTRA PROTECTION
    // =====================================================

    if (user.role === "ADMIN") {
        throw new Error(
            "Admin account must use the admin login"
        );
    }

    // =====================================================
    // PASSWORD
    // =====================================================

    const isPasswordValid =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isPasswordValid) {
        throw new Error(
            "Invalid email or password"
        );
    }

    // =====================================================
    // USER JWT
    // =====================================================

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role
        },
        token
    };
};


module.exports = {
    registerService,
    loginService
};