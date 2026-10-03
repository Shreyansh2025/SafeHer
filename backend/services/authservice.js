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

    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { email },
                { phone }
            ]
        }
    });

    if (existingUser) {

        if (existingUser.email === email) {
            throw new Error("Email already exists");
        }

        if (existingUser.phone === phone) {
            throw new Error("Phone already exists");
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // IMPORTANT:
    // Every public registration is always a USER.
    const user = await User.create({
        name,
        phone,
        email,
        password: hashedPassword,
        role: "USER"
    });

    // Generate JWT
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

    // Find user
    const user = await User.findOne({
        where: {
            email: email
        }
    });

    // User not found
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT
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

    // Return response
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