const profileService = require("../services/profileService");

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await profileService.getProfile(userId);

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: profile
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await profileService.updateProfile(
            userId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE PROFILE
const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        await profileService.deleteProfile(userId);

        return res.status(200).json({
            success: true,
            message: "Profile deleted successfully"
        });

    } catch (error) {
        console.error("Delete profile error:", error);

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    deleteProfile
};