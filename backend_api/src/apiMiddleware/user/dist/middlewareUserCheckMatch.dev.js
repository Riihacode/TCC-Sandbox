"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkUserIdMatch = void 0;

var checkUserIdMatch = function checkUserIdMatch(req, res, next) {
  var loggedInUserId = req.users.id;
  var targetUserId = parseInt(req.params.user_id);

  if (loggedInUserId !== targetUserId) {
    return res.status(403).json({
      error: "Access denied: user ID mismatch"
    });
  }

  next();
};

exports.checkUserIdMatch = checkUserIdMatch;