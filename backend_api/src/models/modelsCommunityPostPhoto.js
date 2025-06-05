import { Sequelize } from "sequelize";
import { db } from "../configDatabase/database.js";
import User from "./modelsUser.js"; // 🔁 Import relasi

const { DataTypes } = Sequelize;

const CommunityPostPhoto = db.define("community_post_photo", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    post_photo_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
    }
    }, {
        tableName: "community_post_photo",
        timestamps: false,
});

export default CommunityPostPhoto;