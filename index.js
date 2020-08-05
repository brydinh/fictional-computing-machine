const express = require("express");
const app = express();

const pool = require("./db");

app.use(express.json());

async function rangeCheck(minFloat, maxFloat, key1, key2) {
  const config = await pool.query("SELECT EXISTS(SELECT 1 FROM configuration WHERE key1 = ($1) " +
    " AND key2 = ($2) AND minFloat <= ($3) AND maxFloat >= ($4))",
    [key1, key2, maxFloat, minFloat]);

  return config.rows;
}

// get all configs
app.get("/configs", async (req, res) => {
  try {
    const configs = await pool.query("SELECT * FROM configuration");
    console.log("Printing configs");
    console.log(configs.rows);

    res.json(configs.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// get a config
app.get("/configs/:id", async (req, res) => {
  try {
    const config = await pool.query("SELECT * FROM configuration WHERE config_id = ($1)", [req.params.id]);
    res.json(config.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
})

// insert a config
app.post("/configs", async (req, res) => {
  try {
    const {
      key1,
      key2,
      minFloat,
      maxFloat,
      value
    } = req.body;

    rangeCheck(minFloat, maxFloat, key1, key2).then(async (result) => {
      const [{exists}] = result;

      if (!exists) {
        const newConfig = await pool.query("INSERT INTO configuration " +
          "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [key1, key2, minFloat, maxFloat, value]);
        res.json(newConfig.rows[0]);
      } else {
        res.send("Already exists");
      }
    });
  } catch (err) {
    console.error(err.message);
  }
});

// update a config

// delete a config

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
