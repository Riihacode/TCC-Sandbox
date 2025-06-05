"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.refreshToken = void 0;

var _modelsUser = _interopRequireDefault(require("../../models/modelsUser.js"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var refreshToken = function refreshToken(req, res) {
  var _refreshToken, user;

  return regeneratorRuntime.async(function refreshToken$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          // Ambil refresh token, simpan ke dalam variabel
          _refreshToken = req.cookies.refreshToken; // Kalau refresh token gaada

          if (_refreshToken) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", res.sendStatus(401));

        case 4:
          _context.next = 6;
          return regeneratorRuntime.awrap(_modelsUser["default"].findOne({
            where: {
              refresh_token: _refreshToken
            }
          }));

        case 6:
          user = _context.sent;

          if (user.refresh_token) {
            _context.next = 11;
            break;
          }

          return _context.abrupt("return", res.sendStatus(403));

        case 11:
          _jsonwebtoken["default"].verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, function (err, decoded) {
            if (err) return res.sendStatus(403);
            console.log("sudah lewat 403 ke dua di controller");
            var userPlain = user.toJSON(); // Konversi ke object

            var _ = userPlain.password,
                __ = userPlain.refresh_token,
                safeUserData = _objectWithoutProperties(userPlain, ["password", "refresh_token"]);

            var accessToken = _jsonwebtoken["default"].sign(safeUserData, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: "30s"
            });

            res.json({
              accessToken: accessToken
            });
          });

        case 12:
          _context.next = 18;
          break;

        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](0);
          // console.log(error);
          console.error("[REFRESH-TOKEN-ERROR]", _context.t0.message);
          res.status(500).json({
            error: "Internal server error"
          });

        case 18:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 14]]);
};

exports.refreshToken = refreshToken;