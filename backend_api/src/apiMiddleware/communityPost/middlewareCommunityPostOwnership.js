import CommunityPostPhoto from "../../models/modelsCommunityPostPhoto.js";

export const checkPhotoOwnership = async (req, res, next) => {
    const loggedInUserId = req.users.id;
    const photoId = parseInt(req.params.photo_id);

    try {
        const photo = await CommunityPostPhoto.findByPk(photoId);
        if (!photo) {
            return res.status(404).json({ error: "Photo post not found" });
        }

        if (photo.user_id !== loggedInUserId) {
            return res.status(403).json({ error: "Access denied: not your post" });
        }

        next();
    } catch (err) {
        console.error("[PHOTO-OWNERSHIP-ERROR]", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
