const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
// const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// const authorization = require("../middleware/authorization");

dotenv.config();

//movies search by title
router.get("/movies/search", async function (req, res, next) {
  try {
    const perPage = 100;
    const currentPage = req.query.page || 1;
    const searchTitle = req.query.title || "";
    const year = req.query.year || "";

    if (!searchTitle) {
      return res.json({
        Error: true,
        Message: "Invalid title. Please provide a valid title.",
      });
    }

    const totalCount = await req
      .db("basics")
      .count("*")
      .where((builder) => {
        builder.where("originalTitle", "like", `%${searchTitle}%`);
        if (year) {
          builder.andWhere("startYear", "like", `%${year}%`);
        }
      })
      .first();

    // Calculate pagination details
    const total = parseInt(totalCount["count(*)"]);
    const lastPage = Math.ceil(total / perPage);
    const from = 1 + perPage * (currentPage - 1);
    const to = Math.min(perPage * currentPage, total);

    const rows = await req
      .db("basics")
      .select("originalTitle", "startYear", "tconst", "titleType")
      .where((builder) => {
        builder.where("originalTitle", "like", `%${searchTitle}%`);
        if (year) {
          builder.andWhere("startYear", "like", `%${year}%`);
        }
      })
      .offset(from - 1)
      .limit(perPage);

    // Transform the data to the desired format
    const result = rows.map((row) => ({
      Title: row.originalTitle,
      Year: row.startYear,
      imdbID: row.tconst,
      Type: row.titleType,
    }));

    // Include pagination details in the response
    const pagination = {
      total,
      lastPage,
      perPage,
      currentPage: parseInt(currentPage),
      from,
      to,
    };

    res.json({
      Error: false,
      Message: "Success",
      movies: result,
      pagination,
    });
  } catch (err) {
    console.log(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  }
});

// movies data by id
router.get("/movies/data/:imdbID", function (req, res, next) {
  const imdbID = req.params.imdbID;

  const imdbIDRegex = /^tt\d{7}$/;

  if (!imdbIDRegex.test(imdbID)) {
    res.status(400).json({
      Error: true,
      Message: "Invalid IMDb ID",
    });
  } else {
    const promises = [
      req
        .db("basics")
        .select("originalTitle", "startYear", "runtimeMinutes", "genres")
        .where({ tconst: imdbID }),

      req
        .db("names")
        .select("primaryName", "primaryProfession", "knownForTitles")
        .where("knownForTitles", "like", `%${imdbID}%`),

      req.db("ratings").select("averageRating").where({ tconst: imdbID }),
    ];

    Promise.all(promises)
      .then(([basicsRows, namesRows, ratingsRows]) => {
        const directors = namesRows
          .filter((row) => row.primaryProfession?.includes("director"))
          .map((row) => row.primaryName);
        const writers = namesRows
          .filter((row) => row.primaryProfession?.includes("writer"))
          .map((row) => row.primaryName);
        const actorsAndActresses = namesRows
          .filter(
            (row) =>
              row.primaryProfession?.includes("actor") ||
              row.primaryProfession?.includes("actress")
          )
          .map((row) => row.primaryName);

        const result = {
          Title: basicsRows[0].originalTitle,
          Year: basicsRows[0].startYear,
          Runtime: basicsRows[0].runtimeMinutes + " min",
          Genre: basicsRows[0].genres,
          Director: directors.join(", "),
          Writer: writers.join(", "),
          Actors: actorsAndActresses.join(", "),
          Ratings: [
            {
              Source: "Internet Movie Database",
              Value: ratingsRows[0]?.averageRating,
            },
          ],
        };

        res.json({
          Error: false,
          Message: "Success",
          select: result,
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({ Error: true, Message: "Error in MySQL query" });
      });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postersDirectory);
  },
  filename: function (req, file, cb) {
    const imdbID = req.params.imdbID;
    const ext = path.extname(file.originalname);
    cb(null, `${imdbID}${ext}`);
  },
});

const postersDirectory = path.join(__dirname, "../../", "posters");
const upload = multer({ storage: storage });

// get posters
router.get("/posters/:imdbID", (req, res) => {
  const imdbID = req.params.imdbID;
  const imageFileName = `${imdbID}.png`;
  const imagePath = path.join(postersDirectory, imageFileName);

  console.log("Attempting to send file:", imagePath);
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

//   // Check if the file exists
//   if (fs.existsSync(imagePath)) {
//     // Send the image file
//     res.sendFile(imagePath, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         console.error("Error stack:", err.stack);
//         res.status(500).send("Internal Server Error");
//       } else {
//         console.log("File sent successfully");
//       }
//     });
//   } else {
//     console.error("File does not exist:", imagePath);
//     res.status(404).send("Not Found");
//   }
// });

// posters/ add
router.post(
  "/posters/add/:imdbID",
  upload.single("poster"),
  function (req, res, next) {
    const imdbID = req.params.imdbID;
    if (!req.file) {
      res.status(400).json({ error: true, message: "No file uploaded" });
    } else {
      const filePath = req.file.path;

      res.status(200).json({
        error: false,
        message: "Poster uploaded successfully",
        filePath,
      });
    }
  }
);

module.exports = router;
