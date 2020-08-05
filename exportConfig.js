const fs = require("fs");
const stringify = require("json-stringify-pretty-compact");

const pool = require("./db");

function createDict(configs) {
  let dict = {};
  let set = new Set();

  configs.forEach(function(config) {
    const keyPair = config.key1 + "_" + config.key2;
    if (!set.has(keyPair)) {
      dict[keyPair] = [];
    }
    dict[keyPair].push([
      [config.minfloat, config.maxfloat], config.value
    ]);
    set.add(keyPair);
  });

  return dict;
}

async function exportJSON() {
  const configs = await pool.query("SELECT * FROM configuration ORDER BY key1, key2, minFloat ASC");
  const dict = createDict(configs.rows);
  const jsonString = stringify(dict, {
    maxLength: 70
  }, 4);

  fs.writeFile('./fep-configs.json', jsonString, err => {
    if (err) {
      console.log('Error writing file', err)
    } else {
      console.log('Successfully wrote file')
    }
  });
}

exportJSON();
// module.exports ={exportJSON};
