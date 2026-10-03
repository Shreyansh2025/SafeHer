const jwt = require("jsonwebtoken");

require("dotenv").config();

const adminMiddleware = (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization token is required"
            });
        }

        // Extract Bearer TOKEN
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token is missing"
            });
        }

        // Verify JWT using admin secret
        const decoded = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET
        );

        // Check if user has admin role
        if (decoded.role !== "ADMIN") {
            return res.status(403).json({
                message: "Access denied. Admin privileges required."
            });
        }

        // Store admin information in request
        req.admin = decoded;

        // Proceed to next middleware/controller
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = adminMiddleware;
