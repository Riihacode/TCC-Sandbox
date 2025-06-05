"use strict";

var _dotenv = _interopRequireDefault(require("dotenv"));

var _express = _interopRequireDefault(require("express"));

var _cors = _interopRequireDefault(require("cors"));

var _path = _interopRequireDefault(require("path"));

var _url = require("url");

require("./src/models/initModels.js");

var _routesUser = _interopRequireDefault(require("./src/apiRoutes/routesUser.js"));

var _routesVideo = _interopRequireDefault(require("./src/apiRoutes/routesVideo.js"));

var _routesCommunityPost = _interopRequireDefault(require("./src/apiRoutes/routesCommunityPost.js"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Memastikan .env terbaca sebelum file lain menggunakannya
_dotenv["default"].config();

// // Konversi __dirname (karena ES Module tidak punya langsung)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
var app = (0, _express["default"])(); // implementasi cookies

app.use((0, _cookieParser["default"])()); // Middlewares umum

app.use((0, _cors["default"])());
app.use(_express["default"].json());
app.use(_express["default"].urlencoded({
  extended: true
})); // Serve static files (supaya file upload bisa diakses)

app.use('/upload', _express["default"]["static"](_path["default"].join(__dirname, 'public', 'upload'))); // API routes dengan global prefix

app.use("/api", _routesUser["default"]);
app.use("/api", _routesVideo["default"]);
app.use("/api", _routesCommunityPost["default"]); // Fallback jika endpoint tidak ditemukan

app.use(function (req, res) {
  res.status(404).json({
    error: "Endpoint not found"
  });
}); // Jalankan server

app.listen(3000, function () {
  return console.log("Server is running on http://localhost:3000");
});