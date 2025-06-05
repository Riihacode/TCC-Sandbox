"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadFileToGCS = uploadFileToGCS;
exports.deleteFileFromGCS = deleteFileFromGCS;

var _storage = require("@google-cloud/storage");

var _dotenv = _interopRequireDefault(require("dotenv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// backend_api/lib/uploadToGCS.js
_dotenv["default"].config();

var storage = new _storage.Storage({
  keyFilename: process.env.GCS_KEY_PATH // path dari .env (untuk dev lokal)
  // alternatif untuk CI/CD:
  // credentials: JSON.parse(process.env.GCS_KEY_JSON)

});
var bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

function uploadFileToGCS(user_id, folder, filename, buffer) {
  var gcsPath, file;
  return regeneratorRuntime.async(function uploadFileToGCS$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          gcsPath = "users/".concat(user_id, "/").concat(folder, "/").concat(filename);
          file = bucket.file(gcsPath);
          _context.next = 4;
          return regeneratorRuntime.awrap(file.save(buffer, {
            resumable: false,
            contentType: "auto",
            metadata: {
              cacheControl: "public, max-age=31536000"
            }
          }));

        case 4:
          return _context.abrupt("return", "https://storage.googleapis.com/".concat(bucket.name, "/").concat(gcsPath));

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
}

function deleteFileFromGCS(user_id, folder, filename) {
  var gcsPath;
  return regeneratorRuntime.async(function deleteFileFromGCS$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          gcsPath = "users/".concat(user_id, "/").concat(folder, "/").concat(filename);
          _context2.next = 3;
          return regeneratorRuntime.awrap(bucket.file(gcsPath)["delete"]());

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  });
}