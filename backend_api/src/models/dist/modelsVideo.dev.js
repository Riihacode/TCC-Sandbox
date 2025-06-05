"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _sequelize = require("sequelize");

var _database = require("../configDatabase/database.js");

var _modelsUser = _interopRequireDefault(require("./modelsUser.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var DataTypes = _sequelize.Sequelize.DataTypes;

var Video = _database.db.define("videos", {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumbnail_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: "videos",
  timestamps: false
});

var _default = Video;
exports["default"] = _default;