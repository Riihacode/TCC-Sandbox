import User from "../models/modelsUser.js";
import fs from "fs";
import path from "path";
import Busboy from "busboy";
import slugify from "slugify";
import { Sequelize, Op } from "sequelize";
// Implementasi Authentication
import { hashPassword } from "../services/serviceAuth.js";
import jwt from "jsonwebtoken";
import { comparePassword } from "../services/serviceAuth.js";
// Deployment
import { 
    uploadFileToGCS,
    deleteFileFromGCS
} from "../services/uploadToGCS.js"; // pastikan path sesuai
import { storage } from "../configDatabase/gcsClient.js";

const bucketName = process.env.GCS_BUCKET_NAME;

async function registerUser(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // ✅ 1. Validasi apakah email dan username sudah ada
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Email already exists"
            });
        }

        // Buat slug awal
        let baseSlug = slugify(username, { lower: true, strict: true });

        // Pastikan slug unik
        let slug = baseSlug;
        let counter = 1;
        while (await User.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
        }

        // Simpan user baru
        // const newUser = await User.create({
        //     username,
        //     slug,
        //     email,
        //     password
        // });

        // Ganti source code di atas dan pakai ini
        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            username,
            slug,
            email,
            password: hashedPassword
        });

        console.log(`[REGISTER] New user: ${username} -> slug: ${slug}`);
        res.status(201).json({
            message: "Register successful",
            user: {
                id: newUser.id,
                username: newUser.username,
                slug: newUser.slug,
                email: newUser.email,
            }
        });

    } catch (error) {
        console.error("[REGISTER ERROR]", error.message);
        res.status(500).json({ error: error.message });
    }
}

// async function loginUser(req, res) {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({
//             where: { email, password },
//             attributes: ["id", "username", "email"]
//         });

//         if (!user) {
//             return res.status(401).json({ error: "Invalid email or password" });
//         }

//         console.log(`[LOGIN] User logged in: ID = ${user.id}, Username = ${user.username}, Email = ${user.email}`);
//         res.status(200).json({ message: "Login successful", user });
//     } catch (error) {
//         console.error(`[LOGIN-ERROR] Failed to process login: ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }

async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await comparePassword(password, user.password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            slug: user.slug
        };

        const accessToken = jwt.sign(
            userData, 
            process.env.ACCESS_TOKEN_SECRET, 
            { 
                expiresIn: "20m" 
            }
        );
        const refreshToken = jwt.sign(
            userData, 
            process.env.REFRESH_TOKEN_SECRET, 
            { 
                expiresIn: "1d" 
            }
        );

        // Simpan refresh_token di DB
        await User.update(
            { refresh_token: refreshToken }, 
            { where: { id: user.id } }
        );

        // Simpan ke cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "Strict", // bisa diubah jadi "Lax" jika diakses dari frontend
            secure: false,      // true jika deploy pakai HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        res.status(200).json({
            message: "Login berhasil",
            accessToken,
            user: userData
        });
    } catch (error) {
        console.error(`[LOGIN ERROR] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

async function logoutUser(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204); // No Content

        const user = await User.findOne({ where: { refresh_token: refreshToken } });
        if (!user) return res.sendStatus(204); // Tidak ditemukan juga tidak masalah

        await User.update({ refresh_token: null }, { where: { id: user.id } });

        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "Logout berhasil" });
    } catch (err) {
        console.error("[LOGOUT-ERROR]", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getUserById(req, res) {
    const { user_id } = req.params;

    try {
        const user = await User.findByPk(user_id, {
            attributes: ['id', 'username', 'email', 'profile_pic']
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        console.error(`[GET-USER-ERROR] ${error.message}`);
        res.status(500).json({ error: "Failed to get user details" });
    }
}

async function deleteUser(req, res) {
    const { user_id } = req.params;

    try {
        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.destroy();

        console.log(`[DELETE-USER] User Deleted: ID = ${user.id}, Username = ${user.username}, Email = ${user.email}`);
        res.status(200).json({ 
            message: "User deleted successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        });
    } catch (error) {
        console.error(`[DELETE-USER] Failed to delete user: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

async function updateUsername(req, res) {
    const { user_id } = req.params;
    const { username } = req.body;

    if (!username || username.trim() === "") {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.username = username;
        await user.save();

        res.status(200).json({ message: "Username updated successfully", username });
    } catch (error) {
        console.error(`[UPDATE-USERNAME-ERROR] ${error.message}`);
        res.status(500).json({ error: "Failed to update username" });
    }
}

// async function uploadProfilePic(req, res) {
//     const user_id = req.params.user_id;

//     // ✅ Validasi awal: pastikan content-type ada dan multipart
//     const contentType = req.headers['content-type'];
//     if (!contentType || !contentType.startsWith('multipart/form-data')) {
//         return res.status(400).json({ error: "Invalid or missing Content-Type. Expected multipart/form-data" });
//     }

//     const busboy = Busboy({ headers: req.headers });

//     let fileBuffer = [];
//     let filename = "";
//     let fileReceived = false;
//     let uploadError = null;

//     const parseForm = () =>
//         new Promise((resolve, reject) => {
//             busboy.on("file", (fieldname, file, info) => {
//                 const { filename: fname, mimeType } = info;

//                 if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
//                     uploadError = "Only image files are allowed";
//                     file.resume();
//                     return;
//                 }

//                 filename = fname;
//                 fileReceived = true;
//                 file.on("data", (chunk) => fileBuffer.push(chunk));
//             });

//             busboy.on("finish", resolve);
//             busboy.on("error", reject);
//         });

//     req.pipe(busboy);

//     try {
//         await parseForm();

//         if (uploadError) {
//             return res.status(400).json({ error: uploadError });
//         }

//         if (!fileReceived) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const user = await User.findByPk(user_id);
//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         if (user.profile_pic) {
//             return res.status(409).json({
//                 error: "Profile picture already exists."
//             });
//         }

//         const sanitized = filename.replace(/\s+/g, "_");
//         const finalFilename = `${Date.now()}-${sanitized}`;
//         const uploadDir = path.join(process.cwd(), "public", "upload", "users", user_id, "uploadedUserPhotoProfile");
//         fs.mkdirSync(uploadDir, { recursive: true });

//         const savePath = path.join(uploadDir, finalFilename);
//         const fileUrl = `/upload/users/${user_id}/uploadedUserPhotoProfile/${finalFilename}`;
//         fs.writeFileSync(savePath, Buffer.concat(fileBuffer));

//         user.profile_pic = fileUrl;
//         await user.save();

//         return res.status(200).json({ message: "Profile picture uploaded", url: fileUrl });
//     } catch (err) {
//         console.error("[UPLOAD-PROFILE-ERROR]", err.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }

async function uploadProfilePic(req, res) {
    const user_id = req.params.user_id;

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
        return res.status(400).json({ error: "Invalid or missing Content-Type. Expected multipart/form-data" });
    }

    const busboy = Busboy({ headers: req.headers });

    let fileBuffer = [];
    let filename = "";
    let fileReceived = false;
    let uploadError = null;

    const parseForm = () =>
        new Promise((resolve, reject) => {
            busboy.on("file", (fieldname, file, info) => {
                const { filename: fname, mimeType } = info;

                if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
                    uploadError = "Only image files are allowed";
                    file.resume();
                    return;
                }

                filename = fname;
                fileReceived = true;
                file.on("data", (chunk) => fileBuffer.push(chunk));
            });

            busboy.on("finish", resolve);
            busboy.on("error", reject);
        });

    req.pipe(busboy);

    try {
        await parseForm();

        if (uploadError) return res.status(400).json({ error: uploadError });
        if (!fileReceived) return res.status(400).json({ error: "No file uploaded" });

        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.profile_pic) return res.status(409).json({ error: "Profile picture already exists." });

        const sanitized = filename.replace(/\s+/g, "_");
        const finalFilename = `${Date.now()}-${sanitized}`;

        const fileUrl = await uploadFileToGCS(
            user_id,
            "uploadedUserPhotoProfile",
            finalFilename,
            Buffer.concat(fileBuffer)
        );

        user.profile_pic = fileUrl;
        await user.save();

        return res.status(200).json({ message: "Profile picture uploaded", url: fileUrl });
    } catch (err) {
        console.error("[UPLOAD-PROFILE-ERROR]", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getUserProfile(req, res) {
    const { user_id } = req.params;

    try {
        const user = await User.findByPk(user_id, {
            attributes: ["id", "username", "email", "profile_pic", "created_at"]
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        console.log(`[GET-USER] User ID: ${user.id}, Username: ${user.username}`);
        res.status(200).json(user);
    } catch (error) {
        console.error(`[GET-USER-ERROR] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

// async function deleteProfilePic(req, res) {
//     const { user_id } = req.params;

//     try {
//         const user = await User.findByPk(user_id);
//         if (!user) return res.status(404).json({ error: "User not found" });

//         const profilePicPath = path.join(process.cwd(), "public", user.profile_pic);

//         if (fs.existsSync(profilePicPath)) {
//             fs.unlinkSync(profilePicPath);
//             console.log(`[DELETE-PROFILE] File deleted: ${profilePicPath}`);
//         }

//         user.profile_pic = null;
//         await user.save();

//         res.status(200).json({ message: "Profile picture deleted successfully" });
//     } catch (error) {
//         console.error(`[DELETE-PROFILE-ERROR] ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }
// async function deleteProfilePic(req, res) {
//     const { user_id } = req.params;

//     try {
//         const user = await User.findByPk(user_id);
//         if (!user)
//         return res.status(404).json({ error: "User not found" });

//         // 🧹 Hapus file dari Cloud Storage jika ada
//         if (user.profile_pic) {
//         const pathParts = user.profile_pic.split("/");
//         const filename = pathParts[pathParts.length - 1];

//         await deleteFileFromGCS(
//             user_id,
//             "uploadedUserPhotoProfile",
//             filename
//         );

//         user.profile_pic = null;
//         await user.save();

//         return res.status(200).json({
//             message: "Profile picture deleted successfully",
//         });
//         } else {
//         return res.status(400).json({ error: "No profile picture to delete" });
//         }
//     } catch (error) {
//         console.error(`[DELETE-PROFILE-ERROR] ${error.message}`);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }

async function deleteProfilePic(req, res) {
    const { user_id } = req.params;

    try {
        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!user.profile_pic) {
            return res.status(400).json({ error: "No profile picture to delete" });
        }

        // Ambil path objek dari URL
        const fileUrl = user.profile_pic;
        const parsedPath = new URL(fileUrl).pathname; // e.g. /bucket-name/users/123/uploadedUserPhotoProfile/file.jpg
        const objectPath = parsedPath.replace(`/${bucketName}/`, ""); // hasil: users/123/uploadedUserPhotoProfile/file.jpg

        // Hapus file dari GCS
        await storage.bucket(bucketName).file(objectPath).delete();
        console.log(`[GCS] Deleted profile pic: ${objectPath}`);

        // Update database
        user.profile_pic = null;
        await user.save();

        return res.status(200).json({ message: "Profile picture deleted successfully" });
    } catch (error) {
        console.error("[DELETE-PROFILE-ERROR]", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

// async function updateProfilePic(req, res) {
//     const user_id = req.params.user_id;

//     // ✅ Validasi Content-Type terlebih dahulu
//     const contentType = req.headers['content-type'];
//     if (!contentType || !contentType.startsWith('multipart/form-data')) {
//         return res.status(400).json({ error: "Invalid or missing Content-Type. Expected multipart/form-data" });
//     }

//     const busboy = Busboy({ headers: req.headers });

//     let fileBuffer = [];
//     let filename = "";
//     let fileReceived = false;
//     let uploadError = null;

//     const parseForm = () =>
//         new Promise((resolve, reject) => {
//             busboy.on("file", (fieldname, file, info) => {
//                 const { filename: fname, mimeType } = info;

//                 if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
//                     uploadError = "Only image files are allowed";
//                     file.resume();
//                     return;
//                 }

//                 filename = fname;
//                 fileReceived = true;
//                 file.on("data", (chunk) => fileBuffer.push(chunk));
//             });

//             busboy.on("finish", resolve);
//             busboy.on("error", reject);
//         });

//     req.pipe(busboy);

//     try {
//         await parseForm();

//         if (uploadError) return res.status(400).json({ error: uploadError });
//         if (!fileReceived) return res.status(400).json({ error: "No file uploaded" });

//         const user = await User.findByPk(user_id);
//         if (!user) return res.status(404).json({ error: "User not found" });

//         // Hapus foto lama jika ada
//         if (user.profile_pic) {
//             const oldPath = path.join(process.cwd(), "public", user.profile_pic.replace(/^\/+/, ""));
//             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//         }

//         const sanitized = filename.replace(/\s+/g, "_");
//         const finalFilename = `${Date.now()}-${sanitized}`;
//         const uploadDir = path.join(process.cwd(), "public", "upload", "users", user_id, "uploadedUserPhotoProfile");
//         fs.mkdirSync(uploadDir, { recursive: true });

//         const savePath = path.join(uploadDir, finalFilename);
//         const newProfilePicUrl = `/upload/users/${user_id}/uploadedUserPhotoProfile/${finalFilename}`;
//         fs.writeFileSync(savePath, Buffer.concat(fileBuffer));

//         user.profile_pic = newProfilePicUrl;
//         await user.save();

//         return res.status(200).json({
//             message: "Profile picture updated successfully",
//             profile_pic: newProfilePicUrl,
//         });
//     } catch (err) {
//         console.error("[UPDATE-PROFILE-ERROR]", err.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }
async function updateProfilePic(req, res) {
    const user_id = req.params.user_id;

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.startsWith("multipart/form-data")) {
        return res.status(400).json({
            error: "Invalid or missing Content-Type. Expected multipart/form-data",
        });
    }

    const busboy = Busboy({ headers: req.headers });

    let fileBuffer = [];
    let filename = "";
    let fileReceived = false;
    let uploadError = null;

    const parseForm = () =>
        new Promise((resolve, reject) => {
        busboy.on("file", (fieldname, file, info) => {
            const { filename: fname, mimeType } = info;

            if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
                uploadError = "Only image files are allowed";
                file.resume();
                return;
            }

            filename = fname;
            fileReceived = true;
            file.on("data", (chunk) => fileBuffer.push(chunk));
        });

        busboy.on("finish", resolve);
        busboy.on("error", reject);
    });

    req.pipe(busboy);

    try {
        await parseForm();

        if (uploadError)
            return res.status(400).json({ error: uploadError });
        if (!fileReceived)
            return res.status(400).json({ error: "No file uploaded" });

        const user = await User.findByPk(user_id);
        if (!user)
            return res.status(404).json({ error: "User not found" });

        // 🧹 Hapus file lama jika ada
        if (user.profile_pic) {
            const pathParts = user.profile_pic.split("/");
            const oldFilename = pathParts[pathParts.length - 1];

            await deleteFileFromGCS(
                user_id,
                "uploadedUserPhotoProfile",
                oldFilename
            );
        }

        // ☁️ Upload file baru ke Cloud Storage
        const sanitized = filename.replace(/\s+/g, "_");
        const finalFilename = `${Date.now()}-${sanitized}`;

        const fileUrl = await uploadFileToGCS(
            user_id,
            "uploadedUserPhotoProfile",
            finalFilename,
            Buffer.concat(fileBuffer)
        );

        // 💾 Update user
        user.profile_pic = fileUrl;
        await user.save();

        return res.status(200).json({
            message: "Profile picture updated successfully",
            profile_pic: fileUrl,
        });
    } catch (err) {
        console.error("[UPDATE-PROFILE-ERROR]", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export {
    registerUser, 
    loginUser, 
    logoutUser,
    getUserById,
    deleteUser, 
    updateUsername,
    uploadProfilePic, 
    getUserProfile, 
    deleteProfilePic,
    updateProfilePic 
};