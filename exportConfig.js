const fs = require("fs");
const stringify = require("json-stringify-pretty-compact");

const pool = require("./db/db");

function createDict(configs) {
  let dict = {};
  let set = new Set();

  configs.forEach(function(config) {
    const keyPair = config.key1 + "_" + config.key2;
    if (!set.has(keyPair)) {
      dict[keyPair] = [];
      set.add(keyPair);
    }
    dict[keyPair].push([
      [config.minfloat, config.maxfloat], config.value
    ]);
  });

  return dict;
}

async function exportJSON() {
  const configs = await pool.query("SELECT * FROM configuration ORDER BY key1, key2, minFloat ASC");
  const dict = createDict(configs.rows);
  const jsonString = stringify(dict, {
    maxLength: 70
  }, 4);

  Object.defineProperty(Date.prototype, 'YYYYMMDDHHMMSS', {
    value: function() {
      function pad2(n) {
        return (n < 10 ? '0' : '') + n;
      }

      return this.getFullYear() +
        pad2(this.getMonth() + 1) +
        pad2(this.getDate()) + "_" +
        pad2(this.getHours()) +
        pad2(this.getMinutes()) +
        pad2(this.getSeconds());
    }
  });

  fs.writeFile("./fep_config_" + new Date().YYYYMMDDHHMMSS() + ".json", jsonString, err => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log("Successfully wrote file");
    }
  });
}

exportJSON();
// module.exports ={exportJSON};
