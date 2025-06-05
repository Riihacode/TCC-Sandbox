import express from "express";
import {
    uploadCommunityPostPhoto, 
    getCommunityPostPhotosByUser, 
    getCommunityPostPhotoById,
    deleteCommunityPostPhoto,
    getCommunityPostsBySlug
} from                              "../apiControllers/controllerCommunityPost.js";
import { verifyToken } from         "../apiMiddleware/token/verifyToken.js";
import { checkPhotoOwnership } from "../apiMiddleware/communityPost/middlewareCommunityPostOwnership.js";

const router = express.Router();

router.post("/photos", verifyToken, uploadCommunityPostPhoto);
// router.get("/users/:user_id/photos", getCommunityPostPhotosByUser);
router.get("/channels/:slug/community", getCommunityPostsBySlug);
router.get("/photos/:photo_id", getCommunityPostPhotoById);
router.delete("/photos/:photo_id", verifyToken, checkPhotoOwnership, deleteCommunityPostPhoto);

export default router;