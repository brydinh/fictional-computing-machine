const config = require("config");
const Pool = require("pg").Pool;

const pool = new Pool ({
  user: config.get("postgresql.user"),
  password: config.get("postgresql.password"),
  database: config.get("postgresql.database"),
  host: config.get("postgresql.host"),
  port: config.get("postgresql.port")
});

module.exports = pool;
