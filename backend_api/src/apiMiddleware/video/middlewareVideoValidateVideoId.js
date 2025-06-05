const validateVideoId = (req, res, next) => {
    const { video_id } = req.params;

    // Validasi awal sebelum operasi (menghindari operasi yang tidak perlu dengan validasi input)
    if (!video_id || isNaN(video_id)) {
        return res.status(400).json({ error: "Invalid video ID" });
    }

    next();
};

export default validateVideoId;