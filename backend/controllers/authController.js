const {
    registerService,
    loginService
} = require("../services/authservice");


// REGISTER
const register = async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;

        // Validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone and password are required"
            });
        }

        const result = await registerService(
            name,
            email,
            phone,
            password
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: result
        });

    } catch (error) {

        console.log("Registration error:", error);

        if (error.message) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// LOGIN
const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await loginService(
            email,
            password
        );

        return res.status(200).json({
            message: "Login successful",
            data: result
        });

    } catch (error) {

        return res.status(401).json({
            message: error.message
        });
    }
};


module.exports = {
    register,
    login
};
