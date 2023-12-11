// const createError = require("http-errors");
// const express = require("express");
// const path = require("path");
// const cookieParser = require("cookie-parser");
// const logger = require("morgan");
// const options = require("./knexfile.js");
// const knex = require("knex")(options);
// const helmet = require("helmet"); // Import helmet
// const cors = require("cors");

// // const swaggerUI = require("swagger-ui-express");
// // const swaggerDocument = require("./docs/openapi.json");
// require("dotenv").config();

// const indexRouter = require("./routes/index");
// const userRouter = require("./routes/user.js");
// const authorization = require("./middleware/authorization.js");
// const app = express();

// // view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "jade");

// logger.token("res", (req, res) => {
//   const headers = {};
//   res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)));
//   return JSON.stringify(headers);
// });

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "../../../posters")));

// app.use(
//   cors({
//     origin: "http://127.0.0.1:5500",
//     credentials: true,
//     //allowedHeaders: ["Content-Type", "Authorization"], // Add Authorization header
//   })
// );

// app.use(logger("dev"));
// app.use(require("./middleWare/logOriginalUrl.js"));
// app.use(helmet());
// // app.use("/user/login", authorization);
// // app.use("/user/register", authorization);
// app.use((req, res, next) => {
//   req.db = knex;
//   next();
// });

// app.get("/protected", authorization, (req, res) => {
//   return res.json({ success: true, message: "Access Granted" });
// });

// // Routes
// // app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
// app.use("/", indexRouter);
// app.use("/user", userRouter);

// app.get("/knex", function (req, res, next) {
//   req.db
//     .raw("SELECT VERSION()")
//     .then((version) => console.log(version[0][0]))
//     .catch((err) => {
//       console.log(err);
//       throw err;
//     });

//   res.send("Version Logged successfully");
// });

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};
//   res.status(err.status || 500);
//   res.render("error");
// });

// module.exports = app;
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const options = require("./knexfile.js");
const knex = require("knex")(options);

// Import routes
const indexRouter = require("./routes/index");
const userRouter = require("./routes/user.js");
const authorization = require("./middleware/authorization.js");

// Create Express app
const app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Logging middleware
logger.token("res", (req, res) => {
  const headers = {};
  res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)));
  return JSON.stringify(headers);
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../../../posters")));
app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(logger("dev"));
app.use(require("./middleWare/logOriginalUrl.js"));
app.use(helmet());

// Custom middleware to attach the Knex instance to the request object
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Routes
app.get("/protected", authorization, (req, res) => {
  return res.json({ success: true, message: "Access Granted" });
});

app.use("/", indexRouter);
app.use("/user", userRouter);

app.get("/knex", function (req, res, next) {
  req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });

  res.send("Version Logged successfully");
});

// Error handling
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
