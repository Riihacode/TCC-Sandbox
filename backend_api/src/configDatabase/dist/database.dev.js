"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectDB = exports.db = void 0;

var _sequelize = require("sequelize");

var _dotenv = _interopRequireDefault(require("dotenv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_dotenv["default"].config(); // const db = new Sequelize(
//     "sosial_media",
//     "root",
//     "", {
//         host: "localhost",
//         password: "",
//         dialect: "mysql",
//     }
// );


var db = new _sequelize.Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  dialect: "mysql"
});
exports.db = db;

var connectDB = function connectDB() {
  return regeneratorRuntime.async(function connectDB$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(db.authenticate());

        case 3:
          console.log("Database connected successfully");
          _context.next = 9;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.log("Database connection failed: ", _context.t0);

        case 9:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
};

exports.connectDB = connectDB;