const express = require("express");
const config = require("config");

const pool = require("./db/db");
const logger = require("./config/logger");

const app = express();

app.use(express.json());


/**
 * Route to retrieve all Valve Configurations with a GET request
 * @param {String} configs the route name
 * @param {async function} async async function
 */
app.get("/configs", async (req, res) => {
  try {
    logger.info("GET request received! Querying all avaliable entries...");

    const entries = await pool.query("SELECT * FROM valveconfiguration");

    logger.info("Sucessfully queried. Sending back response...");
    res.json(entries.rows);
  } catch (err) {
    logger.error(err.message);
  }
});


/**
 * Route to retrieve a Valve Configuration with a GET request
 * @param {String} configs the route name
 * @param {async function} async async function
 */
app.get("/configs/:id", async (req, res) => {
  try {
    const id = req.params.id;

    logger.info("GET request received! Querying for an entry...");

    const entry = await pool.query(
      "SELECT * FROM valveconfiguration " +
      "WHERE id = ($1)", [id]);

    logger.info("Sucessfully queried. Sending back response...");
    res.json(entry.rows[0]);
  } catch (err) {
    logger.error(err.message);
  }
});


/**
 * Route to insert a new Valve Configuration with a POST request
 * @param {String} configs the route name
 * @param {async function} async async function
 */
app.post("/configs", async (req, res) => {
  try {
    const {
      duration,
      days_of_week,
      start_time
    } = req.body;

    logger.info("POST request received! Creating new entry...");

    const newEntry = await pool.query(
      "INSERT INTO valveconfiguration " +
      "(duration, days_of_week, start_time, posted_timestamp) " +
      "VALUES ($1, $2, $3, current_timestamp) " +
      "RETURNING *", [duration, days_of_week, start_time]);

    logger.info("Created new entry. Sending back response...");
    res.json(newEntry.rows[0]);
  } catch (err) {
    logger.error(err.message);
  }
});


/**
 * Route to remove a Valve Configuration with a DELETE request
 * @param {String} configs the route name
 * @param {async function} async async function
 */
app.delete("/configs/:id", async (req, res) => {
  try {
    const id = req.params.id;

    logger.info("DELETE request received! Removing entry...");

    const removedEntry = await pool.query(
      "DELETE FROM valveconfiguration WHERE id = ($1)", [id]);

    logger.info("Deleted entry. Sending back response...");
    res.json("Config successfully deleted!");
  } catch (err) {
    logger.error(err.message);
  }
});


app.listen(config.get("webServer.port"), () => {
  logger.info("Server listening on port " + config.get("webServer.port"));
});