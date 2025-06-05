export const checkUserIdMatch = (req, res, next) => {
    const loggedInUserId = req.users.id;
    const targetUserId = parseInt(req.params.user_id);

    if (loggedInUserId !== targetUserId) {
        return res.status(403).json({ error: "Access denied: user ID mismatch" });
    }

    next();
};