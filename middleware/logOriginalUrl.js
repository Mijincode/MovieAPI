var express = require("express");
var router = express.Router();

function logOriginalUrl(req, res, next) {
  console.log("Request URL:", req.originalUrl);
  next();
}

module.exports = function (req, res, next) {
  console.log("Request URL:", req.originalUrl);
  next();
};
