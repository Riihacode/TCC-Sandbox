import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { fileURLToPath } from "url";
import { dirname } from "path";
import CommunityPostPhoto from "../models/modelsCommunityPostPhoto.js";
import Busboy from "busboy";
import User from "../models/modelsUser.js";
// deployment
import { storage } from "../configDatabase/gcsClient.js"; // dari SDK @google-cloud/storage

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bucketName = process.env.GCS_BUCKET_NAME;

// async function uploadCommunityPostPhoto(req, res) {
//     // ⛔️ Validasi: Content-Type harus multipart/form-data
//     const contentType = req.headers["content-type"];
//     if (!contentType || !contentType.includes("multipart/form-data")) {
//         return res.status(400).json({ error: "Invalid Content-Type. Expected multipart/form-data." });
//     }

//     const busboy = Busboy({ headers: req.headers });

//     let user_id = "";
//     let title = "";
//     let description = "";
//     let fileReceived = false;
//     let fileBuffer = [];
//     let filename = "";
//     let mimeType = "";
//     let uploadError = null;

//     const parseForm = () =>
//         new Promise((resolve, reject) => {
//             busboy.on("field", (fieldname, value) => {
//                 if (fieldname === "user_id") user_id = value;
//                 if (fieldname === "title") title = value;
//                 if (fieldname === "description") description = value;
//             });

//             busboy.on("file", (fieldname, file, info) => {
//                 const { filename: fname, mimeType: mtype } = info;

//                 if (fieldname !== "post_photo_url" || !mtype.startsWith("image/")) {
//                     uploadError = "Only image files are allowed";
//                     file.resume();
//                     return;
//                 }

//                 filename = fname;
//                 mimeType = mtype;
//                 fileReceived = true;

//                 file.on("data", (data) => fileBuffer.push(data));
//             });

//             busboy.on("finish", resolve);
//             busboy.on("error", reject);
//             req.pipe(busboy);
//         });

//     try {
//         await parseForm();

//         if (uploadError) return res.status(400).json({ error: uploadError });

//         if (!fileReceived || !user_id || !title || !description || isNaN(user_id)) {
//             return res.status(400).json({ error: "Required fields are missing or invalid" });
//         }

//         const buffer = Buffer.concat(fileBuffer);
//         const sanitized = filename.replace(/\s+/g, "_");
//         const finalFilename = `${Date.now()}-${sanitized}`;
//         const uploadDir = path.join(process.cwd(), "public", "upload", "users", user_id, "uploadedCommunityPostPhoto");
//         fs.mkdirSync(uploadDir, { recursive: true });

//         const savePath = path.join(uploadDir, finalFilename);
//         const post_photo_url = `/upload/users/${user_id}/uploadedCommunityPostPhoto/${finalFilename}`;
//         const timestamp = moment.utc().toISOString();

//         fs.writeFileSync(savePath, buffer);

//         const newPost = await CommunityPostPhoto.create({
//             user_id,
//             title,
//             description,
//             post_photo_url,
//             uploaded_at: timestamp,
//         });

//         return res.status(201).json({
//             id: newPost.id,
//             title,
//             description,
//             post_photo_url,
//         });
//     } catch (err) {
//         console.error("[UPLOAD ERROR]", err.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }

async function uploadCommunityPostPhoto(req, res) {
    const { user_id } = req.params;

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
    let caption = "";

    const parseForm = () =>
        new Promise((resolve, reject) => {
            busboy.on("file", (fieldname, file, info) => {
                const { filename: fname, mimeType } = info;

                if (fieldname !== "photo" || !mimeType.startsWith("image/")) {
                    uploadError = "Only image files are allowed";
                    file.resume();
                    return;
                }

                filename = fname;
                fileReceived = true;
                file.on("data", (chunk) => fileBuffer.push(chunk));
            });

            busboy.on("field", (fieldname, val) => {
                if (fieldname === "caption") caption = val;
            });

            busboy.on("finish", resolve);
            busboy.on("error", reject);
        });

        req.pipe(busboy);

        try {
            await parseForm();

            if (uploadError) return res.status(400).json({ error: uploadError });
            if (!fileReceived) return res.status(400).json({ error: "No photo uploaded" });

            const sanitized = filename.replace(/\s+/g, "_");
            const finalFilename = `${Date.now()}-${sanitized}`;

            const photoUrl = await uploadFileToGCS(
                user_id,
                "uploadedCommunityPostPhoto",
                finalFilename,
                Buffer.concat(fileBuffer)
            );

            const newPhoto = await CommunityPostPhoto.create({
                user_id,
                caption,
                url: photoUrl,
            });

            return res.status(201).json({
                message: "Photo uploaded successfully",
                data: newPhoto,
            });
        } catch (err) {
            console.error("[UPLOAD-COMMUNITY-ERROR]", err.message);
            return res.status(500).json({ error: "Internal server error" });
        }
}

async function getCommunityPostPhotosByUser(req, res) {
    const { user_id } = req.params;

    try {
        const posts = await CommunityPostPhoto.findAll({
            include: {
                model: User,
                as: "user",
                where: { slug },
                attributes: ["username", "slug", "profile_pic"]
            },
            attributes: ["id", "title", "post_photo_url", "description", "uploaded_at"]
        });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "User or community posts not found" });
        }

        const { username, slug: userSlug, profile_pic } = posts[0].user;

        return res.status(200).json({
            channel: {
                username,
                slug: userSlug,
                profile_pic
            },
            total: posts.length,
            posts
        });

    } catch (error) {
        console.error("[GET-PHOTOS-ERROR]", error.message);
        return res.status(500).json({ error: error.message });
    }
}

async function getCommunityPostPhotoById(req, res) {
    const { photo_id } = req.params;

    try {
        const photo = await CommunityPostPhoto.findByPk(photo_id, {
            attributes: ["id", "user_id", "title", "post_photo_url", "description", "uploaded_at"]
        });

        if (!photo) {
            return res.status(404).json({ error: "Photo not found" });
        }

        return res.status(200).json(photo);
    } catch (error) {
        console.error(`[GET-PHOTO-ERROR] ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
}

// async function deleteCommunityPostPhoto(req, res) {
//     const { photo_id } = req.params;

//     try {
//         const photo = await CommunityPostPhoto.findByPk(photo_id);

//         if (!photo) {
//             return res.status(404).json({ error: "Photo not found" });
//         }

//         const postPhotoPath = path.join(process.cwd(), "public", photo.post_photo_url.replace(/^\/+/, ""));

//         if (fs.existsSync(postPhotoPath)) {
//             fs.unlinkSync(postPhotoPath);
//             console.log(`[DELETE-PHOTO] File deleted: ${postPhotoPath}`);
//         }

//         await photo.destroy();

//         console.log(`[DELETE-PHOTO] Photo with ID ${photo_id} deleted from database`);
//         return res.status(200).json({ message: "Photo deleted successfully" });
//     } catch (error) {
//         console.error(`[DELETE-ERROR] ${error.message}`);
//         return res.status(500).json({ error: error.message });
//     }
// }

async function deleteCommunityPostPhoto(req, res) {
    const { user_id, photo_id } = req.params;

    try {
        const photo = await CommunityPostPhoto.findOne({
            where: { id: photo_id, user_id },
        });

        if (!photo) {
            return res.status(404).json({ error: "Photo not found" });
        }

        // Ekstrak path file dari URL GCS
        const url = photo.url;
        const parsedPath = new URL(url).pathname; // contoh: /bucket-name/users/123/uploadedCommunityPostPhoto/12345.jpg
        const objectPath = parsedPath.replace(`/${bucketName}/`, ""); // hasil: users/123/uploadedCommunityPostPhoto/12345.jpg

        // Hapus file dari GCS
        await storage.bucket(bucketName).file(objectPath).delete();
        console.log(`[GCS] Deleted: ${objectPath}`);

        // Hapus dari database
        await photo.destroy();

        return res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
        console.error("[DELETE-COMMUNITY-ERROR]", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getCommunityPostsBySlug(req, res) {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return res.status(400).json({ error: "Invalid slug parameter" });
    }

    try {
        const user = await User.findOne({ where: { slug } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const photos = await CommunityPostPhoto.findAll({
            where: { user_id: user.id },
            attributes: ["id", "title", "post_photo_url", "description", "uploaded_at"],
            include: {
                model: User,
                as: "user",
                attributes: ["username", "slug", "profile_pic"]
            }
        });


        return res.status(200).json({
            channel: {
                username: user.username,
                slug: user.slug,
                profile_pic: user.profile_pic
            },
            total: photos.length,
            posts: photos
        });
    } catch (error) {
        console.error("[GET-COMMUNITY-POSTS-BY-SLUG]", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export {
    uploadCommunityPostPhoto,
    getCommunityPostPhotosByUser,
    getCommunityPostPhotoById,
    deleteCommunityPostPhoto,
    getCommunityPostsBySlug
};