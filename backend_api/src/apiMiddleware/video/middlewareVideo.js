// import multer from "multer";
// import path from "path";

// //Konfigurasi penyimpanan file video
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/upload/uploadedVideo/'); // Folder tempat menyimpan file video
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname)); // Nama file unik dengan timestamp
//     }
// });

// // Filter untuk memastikan file yang diunggah adalah video
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error('Only video files are allowed!'), false);
//     }
// };

// // Inisialisasi multer
// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 100 * 1025 * 1024 } // Batasan ukuran file (100 MB)
// });

// export default upload;

import multer from "multer";

// Gunakan memoryStorage agar file belum ditulis ke disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

export default upload;
