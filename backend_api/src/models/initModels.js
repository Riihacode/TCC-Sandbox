import User from "./modelsUser.js";
import Video from "./modelsVideo.js";
import CommunityPostPhoto from "./modelsCommunityPostPhoto.js";

// Relasi: User → Video (1:N)
User.hasMany(Video, {
    foreignKey: "user_id",
    as: "videos"
});
Video.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

// Relasi: User → CommunityPostPhoto (1:N)
User.hasMany(CommunityPostPhoto, {
    foreignKey: "user_id",
    as: "community_posts"
});
CommunityPostPhoto.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

export { User, Video, CommunityPostPhoto };
