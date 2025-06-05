import { Storage } from "@google-cloud/storage";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const keyPath = path.join(process.cwd(), process.env.GCS_KEY_PATH);

export const storage = new Storage({
    keyFilename: keyPath,
});
