// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

const videoUploadLimiter = rateLimit({
    // windowMs: 10 * 60 * 1000, // 10 menit
    windowMs: 0 * 60 * 1000, // 10 menit
    max: 5, // max 5 upload video tiap 10 menit
    message: { error: 'Too many uploads from this IP, please try again later.' }
});

export default videoUploadLimiter;