"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.comparePassword = exports.hashPassword = void 0;

var _bcrypt = _interopRequireDefault(require("bcrypt"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var hashPassword = function hashPassword(password) {
  var salt;
  return regeneratorRuntime.async(function hashPassword$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_bcrypt["default"].genSalt());

        case 2:
          salt = _context.sent;
          _context.next = 5;
          return regeneratorRuntime.awrap(_bcrypt["default"].hash(password, salt));

        case 5:
          return _context.abrupt("return", _context.sent);

        case 6:
        case "end":
          return _context.stop();
      }
    }
  });
};

exports.hashPassword = hashPassword;

var comparePassword = function comparePassword(inputPassword, hashedPassword) {
  return regeneratorRuntime.async(function comparePassword$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(_bcrypt["default"].compare(inputPassword, hashedPassword));

        case 2:
          return _context2.abrupt("return", _context2.sent);

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  });
};

exports.comparePassword = comparePassword;