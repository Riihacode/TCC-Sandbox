"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _modelsUser = _interopRequireDefault(require("../../models/modelsUser.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var validateUserId = function validateUserId(req, res, next) {
  var user_id, user;
  return regeneratorRuntime.async(function validateUserId$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          user_id = req.body.user_id || req.params.user_id;

          if (!(!user_id || isNaN(user_id))) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "Invalid user ID"
          }));

        case 3:
          _context.prev = 3;
          _context.next = 6;
          return regeneratorRuntime.awrap(_modelsUser["default"].findByPk(user_id));

        case 6:
          user = _context.sent;

          if (user) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 9:
          req.user = user; // simpan ke req

          next();
          _context.next = 17;
          break;

        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](3);
          console.error("[VALIDATE-USER-ID-ERROR] ".concat(_context.t0.message));
          res.status(500).json({
            error: "Internal server error"
          });

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 13]]);
};

var _default = validateUserId;
exports["default"] = _default;