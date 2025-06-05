"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "User", {
  enumerable: true,
  get: function get() {
    return _modelsUser["default"];
  }
});
Object.defineProperty(exports, "Video", {
  enumerable: true,
  get: function get() {
    return _modelsVideo["default"];
  }
});
Object.defineProperty(exports, "CommunityPostPhoto", {
  enumerable: true,
  get: function get() {
    return _modelsCommunityPostPhoto["default"];
  }
});

var _modelsUser = _interopRequireDefault(require("./modelsUser.js"));

var _modelsVideo = _interopRequireDefault(require("./modelsVideo.js"));

var _modelsCommunityPostPhoto = _interopRequireDefault(require("./modelsCommunityPostPhoto.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Relasi: User → Video (1:N)
_modelsUser["default"].hasMany(_modelsVideo["default"], {
  foreignKey: "user_id",
  as: "videos"
});

_modelsVideo["default"].belongsTo(_modelsUser["default"], {
  foreignKey: "user_id",
  as: "user"
}); // Relasi: User → CommunityPostPhoto (1:N)


_modelsUser["default"].hasMany(_modelsCommunityPostPhoto["default"], {
  foreignKey: "user_id",
  as: "community_posts"
});

_modelsCommunityPostPhoto["default"].belongsTo(_modelsUser["default"], {
  foreignKey: "user_id",
  as: "user"
});