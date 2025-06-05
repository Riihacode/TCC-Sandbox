"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _controllerCommunityPost = require("../apiControllers/controllerCommunityPost.js");

var _verifyToken = require("../apiMiddleware/token/verifyToken.js");

var _middlewareCommunityPostOwnership = require("../apiMiddleware/communityPost/middlewareCommunityPostOwnership.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();

router.post("/photos", _verifyToken.verifyToken, _controllerCommunityPost.uploadCommunityPostPhoto); // router.get("/users/:user_id/photos", getCommunityPostPhotosByUser);

router.get("/channels/:slug/community", _controllerCommunityPost.getCommunityPostsBySlug);
router.get("/photos/:photo_id", _controllerCommunityPost.getCommunityPostPhotoById);
router["delete"]("/photos/:photo_id", _verifyToken.verifyToken, _middlewareCommunityPostOwnership.checkPhotoOwnership, _controllerCommunityPost.deleteCommunityPostPhoto);
var _default = router;
exports["default"] = _default;