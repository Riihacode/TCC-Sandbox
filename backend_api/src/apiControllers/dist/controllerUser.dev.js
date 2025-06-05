"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.logoutUser = logoutUser;
exports.getUserById = getUserById;
exports.deleteUser = deleteUser;
exports.updateUsername = updateUsername;
exports.uploadProfilePic = uploadProfilePic;
exports.getUserProfile = getUserProfile;
exports.deleteProfilePic = deleteProfilePic;
exports.updateProfilePic = updateProfilePic;

var _modelsUser = _interopRequireDefault(require("../models/modelsUser.js"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _busboy = _interopRequireDefault(require("busboy"));

var _slugify = _interopRequireDefault(require("slugify"));

var _sequelize = require("sequelize");

var _serviceAuth = require("../services/serviceAuth.js");

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _uploadToGCS = require("../services/uploadToGCS.js");

var _gcsClient = require("../configDatabase/gcsClient.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var bucketName = process.env.GCS_BUCKET_NAME;

function registerUser(req, res) {
  var _req$body, username, email, password, existingUser, baseSlug, slug, counter, hashedPassword, newUser;

  return regeneratorRuntime.async(function registerUser$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, username = _req$body.username, email = _req$body.email, password = _req$body.password;

          if (!(!username || !email || !password)) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "All fields are required"
          }));

        case 3:
          _context.prev = 3;
          _context.next = 6;
          return regeneratorRuntime.awrap(_modelsUser["default"].findOne({
            where: _defineProperty({}, _sequelize.Op.or, [{
              email: email
            }])
          }));

        case 6:
          existingUser = _context.sent;

          if (!existingUser) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", res.status(409).json({
            error: "Email already exists"
          }));

        case 9:
          // Buat slug awal
          baseSlug = (0, _slugify["default"])(username, {
            lower: true,
            strict: true
          }); // Pastikan slug unik

          slug = baseSlug;
          counter = 1;

        case 12:
          _context.next = 14;
          return regeneratorRuntime.awrap(_modelsUser["default"].findOne({
            where: {
              slug: slug
            }
          }));

        case 14:
          if (!_context.sent) {
            _context.next = 18;
            break;
          }

          slug = "".concat(baseSlug, "-").concat(counter++);
          _context.next = 12;
          break;

        case 18:
          _context.next = 20;
          return regeneratorRuntime.awrap((0, _serviceAuth.hashPassword)(password));

        case 20:
          hashedPassword = _context.sent;
          _context.next = 23;
          return regeneratorRuntime.awrap(_modelsUser["default"].create({
            username: username,
            slug: slug,
            email: email,
            password: hashedPassword
          }));

        case 23:
          newUser = _context.sent;
          console.log("[REGISTER] New user: ".concat(username, " -> slug: ").concat(slug));
          res.status(201).json({
            message: "Register successful",
            user: {
              id: newUser.id,
              username: newUser.username,
              slug: newUser.slug,
              email: newUser.email
            }
          });
          _context.next = 32;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](3);
          console.error("[REGISTER ERROR]", _context.t0.message);
          res.status(500).json({
            error: _context.t0.message
          });

        case 32:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 28]]);
} // async function loginUser(req, res) {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({
//             where: { email, password },
//             attributes: ["id", "username", "email"]
//         });
//         if (!user) {
//             return res.status(401).json({ error: "Invalid email or password" });
//         }
//         console.log(`[LOGIN] User logged in: ID = ${user.id}, Username = ${user.username}, Email = ${user.email}`);
//         res.status(200).json({ message: "Login successful", user });
//     } catch (error) {
//         console.error(`[LOGIN-ERROR] Failed to process login: ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }


function loginUser(req, res) {
  var _req$body2, email, password, user, userData, accessToken, refreshToken;

  return regeneratorRuntime.async(function loginUser$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(_modelsUser["default"].findOne({
            where: {
              email: email
            }
          }));

        case 4:
          user = _context2.sent;
          _context2.t0 = !user;

          if (_context2.t0) {
            _context2.next = 10;
            break;
          }

          _context2.next = 9;
          return regeneratorRuntime.awrap((0, _serviceAuth.comparePassword)(password, user.password));

        case 9:
          _context2.t0 = !_context2.sent;

        case 10:
          if (!_context2.t0) {
            _context2.next = 12;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            error: "Invalid email or password"
          }));

        case 12:
          userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            slug: user.slug
          };
          accessToken = _jsonwebtoken["default"].sign(userData, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "20m"
          });
          refreshToken = _jsonwebtoken["default"].sign(userData, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "1d"
          }); // Simpan refresh_token di DB

          _context2.next = 17;
          return regeneratorRuntime.awrap(_modelsUser["default"].update({
            refresh_token: refreshToken
          }, {
            where: {
              id: user.id
            }
          }));

        case 17:
          // Simpan ke cookie
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "Strict",
            // bisa diubah jadi "Lax" jika diakses dari frontend
            secure: false,
            // true jika deploy pakai HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 1 hari

          });
          res.status(200).json({
            message: "Login berhasil",
            accessToken: accessToken,
            user: userData
          });
          _context2.next = 25;
          break;

        case 21:
          _context2.prev = 21;
          _context2.t1 = _context2["catch"](1);
          console.error("[LOGIN ERROR] ".concat(_context2.t1.message));
          res.status(500).json({
            error: _context2.t1.message
          });

        case 25:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 21]]);
}

function logoutUser(req, res) {
  var refreshToken, user;
  return regeneratorRuntime.async(function logoutUser$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          refreshToken = req.cookies.refreshToken;

          if (refreshToken) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt("return", res.sendStatus(204));

        case 4:
          _context3.next = 6;
          return regeneratorRuntime.awrap(_modelsUser["default"].findOne({
            where: {
              refresh_token: refreshToken
            }
          }));

        case 6:
          user = _context3.sent;

          if (user) {
            _context3.next = 9;
            break;
          }

          return _context3.abrupt("return", res.sendStatus(204));

        case 9:
          _context3.next = 11;
          return regeneratorRuntime.awrap(_modelsUser["default"].update({
            refresh_token: null
          }, {
            where: {
              id: user.id
            }
          }));

        case 11:
          res.clearCookie("refreshToken");
          return _context3.abrupt("return", res.status(200).json({
            message: "Logout berhasil"
          }));

        case 15:
          _context3.prev = 15;
          _context3.t0 = _context3["catch"](0);
          console.error("[LOGOUT-ERROR]", _context3.t0.message);
          return _context3.abrupt("return", res.status(500).json({
            error: "Internal server error"
          }));

        case 19:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 15]]);
}

function getUserById(req, res) {
  var user_id, user;
  return regeneratorRuntime.async(function getUserById$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          user_id = req.params.user_id;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id, {
            attributes: ['id', 'username', 'email', 'profile_pic']
          }));

        case 4:
          user = _context4.sent;

          if (user) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 7:
          res.status(200).json(user);
          _context4.next = 14;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](1);
          console.error("[GET-USER-ERROR] ".concat(_context4.t0.message));
          res.status(500).json({
            error: "Failed to get user details"
          });

        case 14:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 10]]);
}

function deleteUser(req, res) {
  var user_id, user;
  return regeneratorRuntime.async(function deleteUser$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          user_id = req.params.user_id;
          _context5.prev = 1;
          _context5.next = 4;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 4:
          user = _context5.sent;

          if (user) {
            _context5.next = 7;
            break;
          }

          return _context5.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 7:
          _context5.next = 9;
          return regeneratorRuntime.awrap(user.destroy());

        case 9:
          console.log("[DELETE-USER] User Deleted: ID = ".concat(user.id, ", Username = ").concat(user.username, ", Email = ").concat(user.email));
          res.status(200).json({
            message: "User deleted successfully",
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          });
          _context5.next = 17;
          break;

        case 13:
          _context5.prev = 13;
          _context5.t0 = _context5["catch"](1);
          console.error("[DELETE-USER] Failed to delete user: ".concat(_context5.t0.message));
          res.status(500).json({
            error: _context5.t0.message
          });

        case 17:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 13]]);
}

function updateUsername(req, res) {
  var user_id, username, user;
  return regeneratorRuntime.async(function updateUsername$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          user_id = req.params.user_id;
          username = req.body.username;

          if (!(!username || username.trim() === "")) {
            _context6.next = 4;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            error: "Username is required"
          }));

        case 4:
          _context6.prev = 4;
          _context6.next = 7;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 7:
          user = _context6.sent;

          if (user) {
            _context6.next = 10;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 10:
          user.username = username;
          _context6.next = 13;
          return regeneratorRuntime.awrap(user.save());

        case 13:
          res.status(200).json({
            message: "Username updated successfully",
            username: username
          });
          _context6.next = 20;
          break;

        case 16:
          _context6.prev = 16;
          _context6.t0 = _context6["catch"](4);
          console.error("[UPDATE-USERNAME-ERROR] ".concat(_context6.t0.message));
          res.status(500).json({
            error: "Failed to update username"
          });

        case 20:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[4, 16]]);
} // async function uploadProfilePic(req, res) {
//     const user_id = req.params.user_id;
//     // ✅ Validasi awal: pastikan content-type ada dan multipart
//     const contentType = req.headers['content-type'];
//     if (!contentType || !contentType.startsWith('multipart/form-data')) {
//         return res.status(400).json({ error: "Invalid or missing Content-Type. Expected multipart/form-data" });
//     }
//     const busboy = Busboy({ headers: req.headers });
//     let fileBuffer = [];
//     let filename = "";
//     let fileReceived = false;
//     let uploadError = null;
//     const parseForm = () =>
//         new Promise((resolve, reject) => {
//             busboy.on("file", (fieldname, file, info) => {
//                 const { filename: fname, mimeType } = info;
//                 if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
//                     uploadError = "Only image files are allowed";
//                     file.resume();
//                     return;
//                 }
//                 filename = fname;
//                 fileReceived = true;
//                 file.on("data", (chunk) => fileBuffer.push(chunk));
//             });
//             busboy.on("finish", resolve);
//             busboy.on("error", reject);
//         });
//     req.pipe(busboy);
//     try {
//         await parseForm();
//         if (uploadError) {
//             return res.status(400).json({ error: uploadError });
//         }
//         if (!fileReceived) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }
//         const user = await User.findByPk(user_id);
//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }
//         if (user.profile_pic) {
//             return res.status(409).json({
//                 error: "Profile picture already exists."
//             });
//         }
//         const sanitized = filename.replace(/\s+/g, "_");
//         const finalFilename = `${Date.now()}-${sanitized}`;
//         const uploadDir = path.join(process.cwd(), "public", "upload", "users", user_id, "uploadedUserPhotoProfile");
//         fs.mkdirSync(uploadDir, { recursive: true });
//         const savePath = path.join(uploadDir, finalFilename);
//         const fileUrl = `/upload/users/${user_id}/uploadedUserPhotoProfile/${finalFilename}`;
//         fs.writeFileSync(savePath, Buffer.concat(fileBuffer));
//         user.profile_pic = fileUrl;
//         await user.save();
//         return res.status(200).json({ message: "Profile picture uploaded", url: fileUrl });
//     } catch (err) {
//         console.error("[UPLOAD-PROFILE-ERROR]", err.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }


function uploadProfilePic(req, res) {
  var user_id, contentType, busboy, fileBuffer, filename, fileReceived, uploadError, parseForm, user, sanitized, finalFilename, fileUrl;
  return regeneratorRuntime.async(function uploadProfilePic$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          user_id = req.params.user_id;
          contentType = req.headers['content-type'];

          if (!(!contentType || !contentType.startsWith('multipart/form-data'))) {
            _context7.next = 4;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: "Invalid or missing Content-Type. Expected multipart/form-data"
          }));

        case 4:
          busboy = (0, _busboy["default"])({
            headers: req.headers
          });
          fileBuffer = [];
          filename = "";
          fileReceived = false;
          uploadError = null;

          parseForm = function parseForm() {
            return new Promise(function (resolve, reject) {
              busboy.on("file", function (fieldname, file, info) {
                var fname = info.filename,
                    mimeType = info.mimeType;

                if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
                  uploadError = "Only image files are allowed";
                  file.resume();
                  return;
                }

                filename = fname;
                fileReceived = true;
                file.on("data", function (chunk) {
                  return fileBuffer.push(chunk);
                });
              });
              busboy.on("finish", resolve);
              busboy.on("error", reject);
            });
          };

          req.pipe(busboy);
          _context7.prev = 11;
          _context7.next = 14;
          return regeneratorRuntime.awrap(parseForm());

        case 14:
          if (!uploadError) {
            _context7.next = 16;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: uploadError
          }));

        case 16:
          if (fileReceived) {
            _context7.next = 18;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            error: "No file uploaded"
          }));

        case 18:
          _context7.next = 20;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 20:
          user = _context7.sent;

          if (user) {
            _context7.next = 23;
            break;
          }

          return _context7.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 23:
          if (!user.profile_pic) {
            _context7.next = 25;
            break;
          }

          return _context7.abrupt("return", res.status(409).json({
            error: "Profile picture already exists."
          }));

        case 25:
          sanitized = filename.replace(/\s+/g, "_");
          finalFilename = "".concat(Date.now(), "-").concat(sanitized);
          _context7.next = 29;
          return regeneratorRuntime.awrap((0, _uploadToGCS.uploadFileToGCS)(user_id, "uploadedUserPhotoProfile", finalFilename, Buffer.concat(fileBuffer)));

        case 29:
          fileUrl = _context7.sent;
          user.profile_pic = fileUrl;
          _context7.next = 33;
          return regeneratorRuntime.awrap(user.save());

        case 33:
          return _context7.abrupt("return", res.status(200).json({
            message: "Profile picture uploaded",
            url: fileUrl
          }));

        case 36:
          _context7.prev = 36;
          _context7.t0 = _context7["catch"](11);
          console.error("[UPLOAD-PROFILE-ERROR]", _context7.t0.message);
          return _context7.abrupt("return", res.status(500).json({
            error: "Internal server error"
          }));

        case 40:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[11, 36]]);
}

function getUserProfile(req, res) {
  var user_id, user;
  return regeneratorRuntime.async(function getUserProfile$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          user_id = req.params.user_id;
          _context8.prev = 1;
          _context8.next = 4;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id, {
            attributes: ["id", "username", "email", "profile_pic", "created_at"]
          }));

        case 4:
          user = _context8.sent;

          if (user) {
            _context8.next = 7;
            break;
          }

          return _context8.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 7:
          console.log("[GET-USER] User ID: ".concat(user.id, ", Username: ").concat(user.username));
          res.status(200).json(user);
          _context8.next = 15;
          break;

        case 11:
          _context8.prev = 11;
          _context8.t0 = _context8["catch"](1);
          console.error("[GET-USER-ERROR] ".concat(_context8.t0.message));
          res.status(500).json({
            error: _context8.t0.message
          });

        case 15:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[1, 11]]);
} // async function deleteProfilePic(req, res) {
//     const { user_id } = req.params;
//     try {
//         const user = await User.findByPk(user_id);
//         if (!user) return res.status(404).json({ error: "User not found" });
//         const profilePicPath = path.join(process.cwd(), "public", user.profile_pic);
//         if (fs.existsSync(profilePicPath)) {
//             fs.unlinkSync(profilePicPath);
//             console.log(`[DELETE-PROFILE] File deleted: ${profilePicPath}`);
//         }
//         user.profile_pic = null;
//         await user.save();
//         res.status(200).json({ message: "Profile picture deleted successfully" });
//     } catch (error) {
//         console.error(`[DELETE-PROFILE-ERROR] ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }
// async function deleteProfilePic(req, res) {
//     const { user_id } = req.params;
//     try {
//         const user = await User.findByPk(user_id);
//         if (!user)
//         return res.status(404).json({ error: "User not found" });
//         // 🧹 Hapus file dari Cloud Storage jika ada
//         if (user.profile_pic) {
//         const pathParts = user.profile_pic.split("/");
//         const filename = pathParts[pathParts.length - 1];
//         await deleteFileFromGCS(
//             user_id,
//             "uploadedUserPhotoProfile",
//             filename
//         );
//         user.profile_pic = null;
//         await user.save();
//         return res.status(200).json({
//             message: "Profile picture deleted successfully",
//         });
//         } else {
//         return res.status(400).json({ error: "No profile picture to delete" });
//         }
//     } catch (error) {
//         console.error(`[DELETE-PROFILE-ERROR] ${error.message}`);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }


function deleteProfilePic(req, res) {
  var user_id, user, fileUrl, parsedPath, objectPath;
  return regeneratorRuntime.async(function deleteProfilePic$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          user_id = req.params.user_id;
          _context9.prev = 1;
          _context9.next = 4;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 4:
          user = _context9.sent;

          if (user) {
            _context9.next = 7;
            break;
          }

          return _context9.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 7:
          if (user.profile_pic) {
            _context9.next = 9;
            break;
          }

          return _context9.abrupt("return", res.status(400).json({
            error: "No profile picture to delete"
          }));

        case 9:
          // Ambil path objek dari URL
          fileUrl = user.profile_pic;
          parsedPath = new URL(fileUrl).pathname; // e.g. /bucket-name/users/123/uploadedUserPhotoProfile/file.jpg

          objectPath = parsedPath.replace("/".concat(bucketName, "/"), ""); // hasil: users/123/uploadedUserPhotoProfile/file.jpg
          // Hapus file dari GCS

          _context9.next = 14;
          return regeneratorRuntime.awrap(_gcsClient.storage.bucket(bucketName).file(objectPath)["delete"]());

        case 14:
          console.log("[GCS] Deleted profile pic: ".concat(objectPath)); // Update database

          user.profile_pic = null;
          _context9.next = 18;
          return regeneratorRuntime.awrap(user.save());

        case 18:
          return _context9.abrupt("return", res.status(200).json({
            message: "Profile picture deleted successfully"
          }));

        case 21:
          _context9.prev = 21;
          _context9.t0 = _context9["catch"](1);
          console.error("[DELETE-PROFILE-ERROR]", _context9.t0.message);
          return _context9.abrupt("return", res.status(500).json({
            error: "Internal server error"
          }));

        case 25:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[1, 21]]);
} // async function updateProfilePic(req, res) {
//     const user_id = req.params.user_id;
//     // ✅ Validasi Content-Type terlebih dahulu
//     const contentType = req.headers['content-type'];
//     if (!contentType || !contentType.startsWith('multipart/form-data')) {
//         return res.status(400).json({ error: "Invalid or missing Content-Type. Expected multipart/form-data" });
//     }
//     const busboy = Busboy({ headers: req.headers });
//     let fileBuffer = [];
//     let filename = "";
//     let fileReceived = false;
//     let uploadError = null;
//     const parseForm = () =>
//         new Promise((resolve, reject) => {
//             busboy.on("file", (fieldname, file, info) => {
//                 const { filename: fname, mimeType } = info;
//                 if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
//                     uploadError = "Only image files are allowed";
//                     file.resume();
//                     return;
//                 }
//                 filename = fname;
//                 fileReceived = true;
//                 file.on("data", (chunk) => fileBuffer.push(chunk));
//             });
//             busboy.on("finish", resolve);
//             busboy.on("error", reject);
//         });
//     req.pipe(busboy);
//     try {
//         await parseForm();
//         if (uploadError) return res.status(400).json({ error: uploadError });
//         if (!fileReceived) return res.status(400).json({ error: "No file uploaded" });
//         const user = await User.findByPk(user_id);
//         if (!user) return res.status(404).json({ error: "User not found" });
//         // Hapus foto lama jika ada
//         if (user.profile_pic) {
//             const oldPath = path.join(process.cwd(), "public", user.profile_pic.replace(/^\/+/, ""));
//             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//         }
//         const sanitized = filename.replace(/\s+/g, "_");
//         const finalFilename = `${Date.now()}-${sanitized}`;
//         const uploadDir = path.join(process.cwd(), "public", "upload", "users", user_id, "uploadedUserPhotoProfile");
//         fs.mkdirSync(uploadDir, { recursive: true });
//         const savePath = path.join(uploadDir, finalFilename);
//         const newProfilePicUrl = `/upload/users/${user_id}/uploadedUserPhotoProfile/${finalFilename}`;
//         fs.writeFileSync(savePath, Buffer.concat(fileBuffer));
//         user.profile_pic = newProfilePicUrl;
//         await user.save();
//         return res.status(200).json({
//             message: "Profile picture updated successfully",
//             profile_pic: newProfilePicUrl,
//         });
//     } catch (err) {
//         console.error("[UPDATE-PROFILE-ERROR]", err.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }


function updateProfilePic(req, res) {
  var user_id, contentType, busboy, fileBuffer, filename, fileReceived, uploadError, parseForm, user, pathParts, oldFilename, sanitized, finalFilename, fileUrl;
  return regeneratorRuntime.async(function updateProfilePic$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          user_id = req.params.user_id;
          contentType = req.headers["content-type"];

          if (!(!contentType || !contentType.startsWith("multipart/form-data"))) {
            _context10.next = 4;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            error: "Invalid or missing Content-Type. Expected multipart/form-data"
          }));

        case 4:
          busboy = (0, _busboy["default"])({
            headers: req.headers
          });
          fileBuffer = [];
          filename = "";
          fileReceived = false;
          uploadError = null;

          parseForm = function parseForm() {
            return new Promise(function (resolve, reject) {
              busboy.on("file", function (fieldname, file, info) {
                var fname = info.filename,
                    mimeType = info.mimeType;

                if (fieldname !== "profile_pic" || !mimeType.startsWith("image/")) {
                  uploadError = "Only image files are allowed";
                  file.resume();
                  return;
                }

                filename = fname;
                fileReceived = true;
                file.on("data", function (chunk) {
                  return fileBuffer.push(chunk);
                });
              });
              busboy.on("finish", resolve);
              busboy.on("error", reject);
            });
          };

          req.pipe(busboy);
          _context10.prev = 11;
          _context10.next = 14;
          return regeneratorRuntime.awrap(parseForm());

        case 14:
          if (!uploadError) {
            _context10.next = 16;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            error: uploadError
          }));

        case 16:
          if (fileReceived) {
            _context10.next = 18;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            error: "No file uploaded"
          }));

        case 18:
          _context10.next = 20;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 20:
          user = _context10.sent;

          if (user) {
            _context10.next = 23;
            break;
          }

          return _context10.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 23:
          if (!user.profile_pic) {
            _context10.next = 28;
            break;
          }

          pathParts = user.profile_pic.split("/");
          oldFilename = pathParts[pathParts.length - 1];
          _context10.next = 28;
          return regeneratorRuntime.awrap((0, _uploadToGCS.deleteFileFromGCS)(user_id, "uploadedUserPhotoProfile", oldFilename));

        case 28:
          // ☁️ Upload file baru ke Cloud Storage
          sanitized = filename.replace(/\s+/g, "_");
          finalFilename = "".concat(Date.now(), "-").concat(sanitized);
          _context10.next = 32;
          return regeneratorRuntime.awrap((0, _uploadToGCS.uploadFileToGCS)(user_id, "uploadedUserPhotoProfile", finalFilename, Buffer.concat(fileBuffer)));

        case 32:
          fileUrl = _context10.sent;
          // 💾 Update user
          user.profile_pic = fileUrl;
          _context10.next = 36;
          return regeneratorRuntime.awrap(user.save());

        case 36:
          return _context10.abrupt("return", res.status(200).json({
            message: "Profile picture updated successfully",
            profile_pic: fileUrl
          }));

        case 39:
          _context10.prev = 39;
          _context10.t0 = _context10["catch"](11);
          console.error("[UPDATE-PROFILE-ERROR]", _context10.t0.message);
          return _context10.abrupt("return", res.status(500).json({
            error: "Internal server error"
          }));

        case 43:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[11, 39]]);
}