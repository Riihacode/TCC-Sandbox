import { Sequelize } from "sequelize";
import { db } from "../configDatabase/database.js";
import CommunityPostPhoto from "./modelsCommunityPostPhoto.js"; // 🔁 Tambahkan ini
import Video from "./modelsVideo.js";

const { DataTypes } = Sequelize;

const User = db.define(
    "users", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        profile_pic: {
            type: DataTypes.STRING,
            allowNull: true
        },
        refresh_token: {            // Tambahkan ini di database sql
            type: DataTypes.TEXT,
            allowNull: true
        }, 
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: "users",
        timestamps: false,
    }
);

db.sync().then(() => console.log("Database Synchronized"));

export default User;