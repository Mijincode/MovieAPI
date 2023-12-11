const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const authorization = require("../middleware/authorization");

dotenv.config();

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

// router.use(cors());

//movies search by title
router.get("/movies/search", async function (req, res, next) {
  try {
    const perPage = 100;
    const currentPage = req.query.page || 1;
    const searchTitle = req.query.title || "";
    const year = req.query.year || "";

    const yearPattern = /^\d{4}$/;

    // Test if the year matches the pattern
    if (year && !yearPattern.test(year)) {
      return res.status(400).json({
        status: 400,
        error: true,
        message: "Invalid year format. Format must be yyyy.",
      });
    }

    if (!searchTitle) {
      return res.status(400).json({
        status: 400,
        error: true,
        message: "Invalid search. Must enter a title.",
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

    res.status(200).json({
      status: 200,
      error: false,
      message: result,
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
      status: 400,
      Error: true,
      Message: "Invalid query parameter: invalid imdbID.",
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

        res.status(200).json({
          status: 200,
          Error: false,
          Message: result,
        });
      })
      .catch((err) => {
        c(err);
        res.json({ Error: true, Message: "Error in MySQL query" });
      });
  }
});

// get posters
router.get("/posters/:imdbID", (req, res) => {
  const imdbID = req.params.imdbID;
  const imageFileName = `${imdbID}.png`;
  const imagePath = path.join(postersDirectory, imageFileName);

  res.sendFile(imagePath, (err) => {
    // res.status(200).json({status: 200, message: ""})
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

// router.use("/posters/add/:imdbID", authorization);

// posters/ add
router.post(
  "/posters/add/:imdbID",
  // authorization,
  upload.single("poster"),
  async function (req, res, next) {
    try {
      // File upload logic
      if (!req.file) {
        return res.status(400).json({
          status: 400,
          error: true,
          message: "Bad Request: No poster file provided",
        });
      }

      const filePath = req.file.path;

      // Additional logic for file writing, if needed

      res.status(200).json({
        status: 200,
        error: false,
        message: "Poster uploaded successfully",
      });
    } catch (error) {
      console.error("Error during poster upload:", error);

      // Internal Server Error
      res.status(500).json({
        status: 500,
        error: true,
        message: "Internal Server Error: Failed to upload the poster",
      });
    }
  }
);
module.exports = router;
