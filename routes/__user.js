// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");

// dotenv.config();

// // Middleware to verify if request body has email and password
// const verifyRequestBody = (req, res, next) => {
//   const email = req.body.email;
//   const password = req.body.password;

//   if (!email || !password) {
//     res.status(400).json({
//       error: true,
//       message: "Request body incomplete - email and password needed",
//     });
//     return;
//   }

//   next();
// };

// // Middleware to check if the user already exists
// const checkUserExists = (req, res, next) => {
//   const email = req.body.email;

//   const queryUsers = req.db
//     .from("users")
//     .select("*")
//     .where("email", "=", email);

//   queryUsers
//     .then((users) => {
//       if (users.length > 0) {
//         console.log("User already exists");
//         return res.status(400).json({
//           error: true,
//           message: "User already exists",
//         });
//       }

//       console.log("No matching users");
//       next(); // Continue to the next middleware/route
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({
//         error: true,
//         message: "Internal Server Error",
//       });
//     });
// };

// // user register
// router.post(
//   "/register",
//   verifyRequestBody,
//   checkUserExists,
//   function (req, res, next) {
//     const email = req.body.email;
//     const password = req.body.password;

//     // Insert user into DB
//     const saltRounds = 10;
//     const hash = bcrypt.hashSync(password, saltRounds);

//     req.db
//       .from("users")
//       .insert({ email, hash })
//       .then(() => {
//         res.status(201).json({ success: true, message: "User created" });
//       })
//       .catch((error) => {
//         console.error(error);
//         res.status(500).json({
//           error: true,
//           message: "Internal Server Error",
//         });
//       });
//   }
// );

// // user login
// router.post("/login", verifyRequestBody, function (req, res, next) {
//   const email = req.body.email;
//   const password = req.body.password;

//   const queryUsers = req.db
//     .from("users")
//     .select("*")
//     .where("email", "=", email);

//   queryUsers
//     .then((users) => {
//       if (users.length === 0) {
//         console.log("User does not exist");
//         throw new Error("User not found");
//       }

//       const user = users[0];
//       return bcrypt.compare(password, user.hash);
//     })
//     .then((match) => {
//       if (!match) {
//         console.log("Passwords do not match");
//         throw new Error("Passwords do not match");
//       }

//       // Create and return JWT token
//       const expires_in = 60 * 60 * 24; // 24 hours
//       const exp = Math.floor(Date.now() / 1000) + expires_in;
//       const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);

//       res.status(200).json({
//         token,
//         token_type: "Bearer",
//         expires_in,
//       });
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(401).json({
//         error: true,
//         message: "Incorrect email or password",
//       });
//     });
// });

// module.exports = router;
