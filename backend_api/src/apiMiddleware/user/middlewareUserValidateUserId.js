import User from "../../models/modelsUser.js";

const validateUserId = async (req, res, next) => {
    const user_id = req.body.user_id || req.params.user_id;

    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ error: "User not found" });

        req.user = user; // simpan ke req
        next();
    } catch (error) {
        console.error(`[VALIDATE-USER-ID-ERROR] ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default validateUserId;