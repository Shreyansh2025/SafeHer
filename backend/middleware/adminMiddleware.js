const jwt = require("jsonwebtoken");

require("dotenv").config();

const adminMiddleware = (req, res, next) => {
    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required"
            });
        }

        const [scheme, token] =
            authHeader.split(" ");

        if (
            scheme !== "Bearer" ||
            !token
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        if (!process.env.ADMIN_JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Admin JWT secret is not configured"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET
        );

        if (
            !decoded ||
            decoded.role !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied. Admin privileges required."
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });

    }
};

module.exports = adminMiddleware;