"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _sequelize = require("sequelize");

var _database = require("../configDatabase/database.js");

var _modelsUser = _interopRequireDefault(require("./modelsUser.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// 🔁 Import relasi
var DataTypes = _sequelize.Sequelize.DataTypes;

var CommunityPostPhoto = _database.db.define("community_post_photo", {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  post_photo_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: "community_post_photo",
  timestamps: false
});

var _default = CommunityPostPhoto;
exports["default"] = _default;