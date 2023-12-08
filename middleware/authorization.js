// middleware/authorization.js
// const express = require("express");
// const router = express.Router();
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Check for the presence and format of the 'Authorization' header
  if (
    !("authorization" in req.headers) ||
    !req.headers.authorization.match(/^Bearer /)
  ) {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
    return;
  }

  // Extract the token from the 'Authorization' header
  const token = req.headers.authorization.replace(/^Bearer /, "");
  console.log("DEBUG token:", token);

  // Check if JWT token is valid
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    res.status(500).json({
      error: true,
      message: "JWT secret key not configured",
    });
    return;
  }

  try {
    // Verify the JWT token
    jwt.verify(token, secretKey);
    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      res.status(401).json({ error: true, message: "JWT token has expired" });
    } else {
      res
        .status(401)
        .json({ error: true, message: `Invalid JWT token: ${e.message}` });
    }
    return;
  }
};
