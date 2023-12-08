const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Function to retrieve email and password from request body
const getUserCredentials = (req) => {
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    throw {
      status: 400,
      message: "Request body incomplete - email and password needed",
    };
  }

  return { email, password };
};

// Function to check if user exists in the table
const checkUserExists = async (req, email) => {
  const users = await req.db
    .from("users")
    .select("*")
    .where("email", "=", email);
  return users.length > 0;
};

// Function to insert user into DB
const insertUser = (req, email, password) => {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  return req.db.from("users").insert({ email, hash });
};

// Function to compare password hashes
const comparePasswords = async (password, userHash) => {
  return await bcrypt.compare(password, userHash);
};

// Register route
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = getUserCredentials(req);

    if (await checkUserExists(req, email)) {
      console.log("User already exists");
    } else {
      await insertUser(req, email, password);
      res.status(201).json({ success: true, message: "User created" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = getUserCredentials(req);

    const users = await req.db
      .from("users")
      .select("*")
      .where("email", "=", email);
    if (users.length === 0) {
      console.log("User does not exist");
      return;
    }

    console.log("User exists in table");

    const user = users[0];
    const match = await comparePasswords(password, user.hash);

    if (!match) {
      console.log("Passwords do not match");
      return;
    }

    console.log("Passwords match");

    const expires_in = 60 * 60 * 24;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);

    res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Internal Server Error",
    });
  }
});

module.exports = router;
