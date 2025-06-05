"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storage = void 0;

var _storage = require("@google-cloud/storage");

var _path = _interopRequireDefault(require("path"));

var _dotenv = _interopRequireDefault(require("dotenv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_dotenv["default"].config();

var keyPath = _path["default"].join(process.cwd(), process.env.GCS_KEY_PATH);

var storage = new _storage.Storage({
  keyFilename: keyPath
});
exports.storage = storage;