const express = require("express");
const config = require("config");

const pool = require("./db/db");

const app = express();

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
    res.json(configs.rows);
  } catch (err) {
    console.error(err.message);
  }
});

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
        res.json("Already exists");
      }
    });
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
});

// update a config
app.put("/configs/:id", async (req, res) => {
  try {
    const {
      key1,
      key2,
      minFloat,
      maxFloat,
      value
    } = req.body;

    const check = await pool.query("SELECT minFloat, maxFloat from configuration WHERE config_id = $1", [req.params.id]);

    // see if min and max changed from original entry
    if (check.rows[0].minfloat != minFloat || check.rows[0].maxfloat != maxFloat) {
      rangeCheck(minFloat, maxFloat, key1, key2).then(async (result) => {
        const [{exists}] = result;
        if (!exists) {
          const updateConfig = await pool.query("UPDATE configuration SET key1 = $1, " +
            "key2 = $2, minFloat = $3, maxFloat = $4, value = $5 WHERE config_id = $6 ",
            [key1, key2, minFloat, maxFloat, value, req.params.id]);
          res.json("Config was updated!");
        } else {
          res.json("Already exists");
        }
      });
    } else {
      const updateConfig = await pool.query("UPDATE configuration SET key1 = $1, " +
        "key2 = $2, minFloat = $3, maxFloat = $4, value = $5 WHERE config_id = $6 ",
        [key1, key2, minFloat, maxFloat, value, req.params.id]);
      res.json("Config was updated!");
    }
  } catch (err) {
    console.error(err.message);
  }
});

// delete a config
app.delete("/configs/:id", async (req, res) => {
  try {
    const deleteConfig = await pool.query("DELETE FROM configuration WHERE config_id = $1", [req.params.id]);
    res.json("Config successfully deleted!");
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(config.get("webServer.port"), () => {
  console.log("Server listening on port 3000");
});
