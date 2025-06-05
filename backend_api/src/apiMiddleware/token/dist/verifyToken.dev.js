"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verifyToken = void 0;

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var verifyToken = function verifyToken(req, res, next) {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1]; // kalau tokennya gaada

  if (token == null) return res.sendStatus(401);

  _jsonwebtoken["default"].verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) return res.sendStatus(403); // req.email = decoded.email;
    // req.users = decoded;

    req.users = decoded; // console.log("✅ Token verified, payload decoded:", decoded);

    next();
  });
};

exports.verifyToken = verifyToken;