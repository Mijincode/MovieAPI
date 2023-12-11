const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const authorization = require("../middleware/authorization");

dotenv.config();

router.post("/register", async (req, res, next) => {
  try {
    const email = req.body.registerEmail;
    const password = req.body.registerPassword;

    if (!email || !password) {
      res.status(400).json({
        status: 400,
        error: true,
        message:
          "Request body incomplete, both email and password are required",
      });
      return;
    }

    const users = await req.db
      .from("users")
      .select("*")
      .where("email", "=", email);

    if (users.length > 0) {
      return res
        .status(409)
        .json({ status: 409, error: true, message: "User already exists" });
    }

    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    await req.db.from("users").insert({ email, hash });

    res.status(201).json({ status: 201, message: "User created" });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// user login
router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.loginEmail;
    const password = req.body.loginPassword;

    if (!email || !password) {
      res.status(400).json({
        status: 400,
        error: true,
        message:
          "Request body incomplete, both email and password are required",
      });
      return;
    }

    const users = await req.db
      .from("users")
      .select("*")
      .where("email", "=", email);

    if (users.length === 0) {
      console.log("User does not exist");
      return res.status(401).json({
        status: 401,
        error: true,
        message: "Invalid email or password - User does not exist",
      });
    }

    console.log("User exists in table");

    const user = users[0];
    const match = await bcrypt.compare(password, user.hash);

    if (!match) {
      return res.status(401).json({
        status: 401,
        error: true,
        message: "Incorrect email or password",
      });
    }

    const expires_in = 60 * 60 * 24;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);
    res.cookie("jwt", token, { httpOnly: true, secure: true });

    return res.status(200).json({
      status: 200,
      token,
      token_type: "Bearer",
      expires_in,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/protected", authorization, (req, res) => {
  return res.json({ success: true, message: "Access Granted" });
});

module.exports = router;
