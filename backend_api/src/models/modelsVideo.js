import { Sequelize } from "sequelize";
import { db } from "../configDatabase/database.js";
import User from "./modelsUser.js";

const { DataTypes } = Sequelize;

const Video = db.define(
    "videos", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnail_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        uploaded_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: "videos",
        timestamps: false
    }
);

export default Video;
