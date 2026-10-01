const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {Op} = require('sequelize')

require("dotenv").config();


//register
const registerService = async (name, email,phone, password,role) => {
    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [Op.or]:[{email},{phone}]
        }
    }); 

    if (existingUser) {
         if(existingUser.email===email){
            throw new Error("email already exist");
        }
        if(existingUser.phone===phone){
            throw new Error("phone already exist");
        }
        
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
        name: name,
        phone:phone,
        email: email,
        password: hashedPassword,
        role:role
    });

    // Generate JWT
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
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
            phone:user.phone,
            email: user.email,
            role:user.role
        },
        token: token
    };
};


//login
const loginService = async (email, password) => {

    // 1. Find user
    const user = await User.findOne({
        where: {
            email: email
        }
    });

    // User not found
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // 3. Generate JWT
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

    // 4. Return response
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