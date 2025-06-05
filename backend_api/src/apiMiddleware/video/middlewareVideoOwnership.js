import Video from "../../models/modelsVideo.js";

export const checkVideoOwnership = async (req, res, next) => {
    const loggedInUserId = req.users.id;
    const videoId = parseInt(req.params.video_id);

    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        if (video.user_id !== loggedInUserId) {
            return res.status(403).json({ error: "Access denied: not your video" });
        }

        next();
    } catch (error) {
        console.error("[VIDEO-OWNERSHIP-CHECK]", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
