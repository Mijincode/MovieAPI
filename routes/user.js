const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// router.post("/register", function (req, res, next) {
//   const email = req.body.email;
//   const password = req.body.password;

//   if (!email || !password) {
//     res.status(400).json({
//       error: true,
//       message: "Request body incomplete - email and password needed",
//     });
//     return;
//   }

//   const queryUsers = req.db
//     .from("users")
//     .select("*")
//     .where("email", "=", email);
//   queryUsers
//     .then((users) => {
//       if (users.length > 0) {
//         console.log("User already exists");
//         return;
//       }
//       const saltRounds = 10;
//       const hash = bcrypt.hashSync(password, saltRounds);
//       return req.db.from("users").insert({ email, hash });
//     })
//     .then(() => {
//       res.status(201).json({ success: true, message: "User created" });
//     });
// });
router.post("/register", async (req, res, next) => {
  console.log(req.body);
  try {
    const email = req.body.registerEmail;
    const password = req.body.registerPassword;
    console.log({ email, password });

    if (!email || !password) {
      res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
      });
      return;
    }

    const users = await req.db
      .from("users")
      .select("*")
      .where("email", "=", email);

    if (users.length > 0) {
      console.log("User already exists");
      return res.status(409).json({
        error: true,
        message: "User already exists",
      });
    }

    const saltRounds = 10;
    console.log("DEBUG - at salt rounds"); // TODO: Remove this line
    const hash = bcrypt.hashSync(password, saltRounds);
    await req.db.from("users").insert({ email, hash });

    res.status(201).json({ success: true, message: "User created" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// // user login
router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.loginEmail;
    const password = req.body.loginPassword;

    if (!email || !password) {
      res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
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
        error: true,
        message: "Invalid email or password - User does not exist",
      });
    }

    console.log("User exists in table");

    const user = users[0];
    const match = await bcrypt.compare(password, user.hash);

    if (!match) {
      console.log("Passwords do not match");
      return res.status(401).json({
        error: true,
        message: "Invalid email or password - Passwords do not match",
      });
    }

    console.log("Passwords match");

    const expires_in = 60 * 60 * 24;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);
    res.cookie("jwt", token, { httpOnly: true, secure: true });

    return res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
