import dotenv from "dotenv";
// Memastikan .env terbaca sebelum file lain menggunakannya
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./src/models/initModels.js"; // agar relasi aktif

// Routes
import routesUser from "./src/apiRoutes/routesUser.js";
import routesVideo from "./src/apiRoutes/routesVideo.js";
import routesCommunityPost from "./src/apiRoutes/routesCommunityPost.js";
// implementasi cookies
import cookieParser from "cookie-parser";


// Konversi __dirname (karena ES Module tidak punya langsung)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// implementasi cookies
app.use(cookieParser());
// Middlewares umum
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (supaya file upload bisa diakses)
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload')));

// API routes dengan global prefix
app.use("/api", routesUser);
app.use("/api", routesVideo);
app.use("/api", routesCommunityPost);

// Fallback jika endpoint tidak ditemukan
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Jalankan server
app.listen(3000, () => console.log("Server is running on http://localhost:3000"));