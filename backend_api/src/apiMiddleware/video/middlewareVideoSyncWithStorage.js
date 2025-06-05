import fs from "fs";
import path from "path";
import { db } from "../../configDatabase/database.js";

const syncVideosWithStorage = async (req, res, next) => {
    try {
        // Ambil semua folder user di upload/users
        const userDirs = fs.readdirSync(path.join(process.cwd(), 'public', 'upload', 'users'));

        let deleteCount = 0;

        for (const userId of userDirs) {
            const userVideoDir = path.join(process.cwd(), 'public', 'upload', 'users', userId, 'uploadedVideo');

            if (!fs.existsSync(userVideoDir)) continue;

            const videoFiles = fs.readdirSync(userVideoDir);

            // Ambil semua video milik user tertentu dari database
            const [videos] = await db.query(`
                SELECT id, video_url FROM videos WHERE user_id = ${parseInt(userId)}
            `);

            for (let video of videos) {
                const fileName = video.video_url.split('/').pop();

                if (!videoFiles.includes(fileName)) {
                    // Gunakan backtick string agar ? tidak error
                    await db.query(`
                        DELETE FROM videos WHERE id = ${video.id}
                    `);

                    console.log(`[SYNC-DELETE] Video ID ${video.id} deleted (missing file)`);
                    deleteCount++;
                }
            }
        }

        console.log(`[SYNC-COMPLETED] ${deleteCount} videos deleted from database.`);
        next();
    } catch (error) {
        console.error(`[SYNC-ERROR] Failed to sync videos: ${error.message}`);
        next(); // tetap lanjut agar tidak blok endpoint utama
    }
};

export default syncVideosWithStorage;
