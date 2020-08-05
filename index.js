const express = require("express");
const app = express();
const pool = require("./db");

app.use(express.json());

// get all configs

// get a configs

// insert a config

app.post("/configs", async (req, res) => {
  try {
    // perform conflict check

    const {
      key1,
      key2,
      minFloat,
      maxFloat,
      value
    } = req.body;

    const newConfig = await pool.query("INSERT INTO configuration " +
      "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5)" +
      " RETURNING *", [key1, key2, minFloat, maxFloat, value]);

    res.json(newConfig);

  } catch (err) {
    console.error(err.message);
  }
});

// update a config

// delete a config

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
