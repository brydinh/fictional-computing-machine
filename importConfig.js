const fs = require("fs");
const readline = require("readline");
const pool = require("./db/db");

// let key1 = "";
// let key2 = "";
// let minFloat = "";
// let maxFloat = "";
let value = "";
let num = 0;
let keyLists = [];

const lineReader = readline.createInterface({
  input: fs.createReadStream("importExample.txt")
});

// TODO: Account for edge cases & numerous values case
lineReader.on('line', function(line) {
  if (num == 0) {
    var newVal = line.match(/\[(.*?)\]/);

    if (newVal) {
      value = newVal[1];
      console.log(value);
    }

  } else if (num == 1) {
    keys = line.split(' = ').slice(1)[0].split(/\,\s?(?![^\(]*\))/);

    keys.forEach(function(a) {
      keyLists.push(makeTuple(a)[0]);
    });

    // console.log(keyLists);

    keyLists.forEach(async function(tuple) {
      if (tuple.length == 3) {
        [key1, key2, flt] = tuple;
        let minFloat = parseFloat(flt) - 0.01;
        let maxFloat = parseFloat(flt) + 0.01;

        const newConfig = await pool.query("INSERT INTO configuration " +
          "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [key1, key2, minFloat, maxFloat, value]);

        console.log(newConfig.rows[0]);

      } else {
        console.log(tuple + " man bad");
      }
    });
  }
  num++;
});


function makeTuple(str) {
  return str
    .replace(/\s/g, "")
    .split("),(")
    .map(el => [...el.replace(/[\()\]]/g, '').split(',')]);
}
