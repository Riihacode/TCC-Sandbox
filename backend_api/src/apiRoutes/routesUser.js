import express from "express";
import {
    registerUser, 
    loginUser, 
    logoutUser,
    getUserById,
    deleteUser, 
    updateUsername,
    uploadProfilePic, 
    deleteProfilePic, 
    updateProfilePic 
} from "../apiControllers/controllerUser.js";
// implementasi token
import { refreshToken } from "../apiMiddleware/token/refreshToken.js";
import { verifyToken } from "../apiMiddleware/token/verifyToken.js";
import { checkUserIdMatch } from "../apiMiddleware/user/middlewareUserCheckMatch.js";

const router = express.Router();

router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
// router.delete("/users/logout", logoutUser);
router.delete("/users/logout", verifyToken, logoutUser);
router.get("/users/:user_id", getUserById);  // Tambahan route GET
// router.delete("/users/:user_id", deleteUser);
// router.put("/users/:user_id/username", updateUsername);
router.delete("/users/:user_id", verifyToken, checkUserIdMatch, deleteUser);
router.put("/users/:user_id/username", verifyToken, checkUserIdMatch, updateUsername);

// Profile picture
router.post("/users/:user_id/profile-picture", verifyToken, checkUserIdMatch, uploadProfilePic);
router.put("/users/:user_id/profile-picture", verifyToken, checkUserIdMatch, updateProfilePic);
router.delete("/users/:user_id/profile-picture", verifyToken, checkUserIdMatch, deleteProfilePic);

// implementasi token
router.get("/token", refreshToken);

export default router;