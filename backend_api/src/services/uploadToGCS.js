// backend_api/lib/uploadToGCS.js
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
dotenv.config();

const storage = new Storage({
  keyFilename: process.env.GCS_KEY_PATH, // path dari .env (untuk dev lokal)
  // alternatif untuk CI/CD:
  // credentials: JSON.parse(process.env.GCS_KEY_JSON)
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

export async function uploadFileToGCS(user_id, folder, filename, buffer) {
    const gcsPath = `users/${user_id}/${folder}/${filename}`;
    const file = bucket.file(gcsPath);

    await file.save(buffer, {
        resumable: false,
        contentType: "auto",
        metadata: {
            cacheControl: "public, max-age=31536000"
        }
    });

    return `https://storage.googleapis.com/${bucket.name}/${gcsPath}`;
}

export async function deleteFileFromGCS(user_id, folder, filename) {
    const gcsPath = `users/${user_id}/${folder}/${filename}`;
    await bucket.file(gcsPath).delete();
}
