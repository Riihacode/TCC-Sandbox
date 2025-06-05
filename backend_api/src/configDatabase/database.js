import  { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// const db = new Sequelize(
//     "sosial_media",
//     "root",
//     "", {
//         host: "localhost",
//         password: "",
//         dialect: "mysql",
//     }
// );

const db = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        dialect: "mysql",
    }
);

const connectDB = async () => {
    try {
        await db.authenticate();
        console.log("Database connected successfully");
    } catch(error) {
        console.log("Database connection failed: ", error);
    }
}

export {
    db, 
    connectDB
};