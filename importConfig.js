const fs = require("fs");
const readline = require("readline");
const pool = require("./db/db");

let value = "";
let lnum = 0;
let keyLists = [];
let test = new Map();

function makeTuple(str) {
  return str
    .replace(/\s/g, "")
    .split("),(")
    .map(el => [...el.replace(/[\()\]]/g, '').split(',')]);
}

function groupEntries(lst) {
  lst.sort();

  let groupings = [];
  let range = lst[0] + .02;
  let indx = 0;

  groupings.push([]);

  lst.forEach(function(flt) {
    if (flt <= range) {
      groupings[indx].push(flt);
    } else {
      range = flt + .02;
      groupings.push([flt]);
      indx++;
    }
  });

  return groupings;
}

const lineReader = readline.createInterface({
  input: fs.createReadStream("importExample.cfg")
});

// TODO: Account for edge cases & numerous values case
lineReader.on('line', function(line) {
  if (lnum == 0) {
    var newVal = line.match(/\[(.*?)\]/);

    if (newVal) {
      value = newVal[1];
    }

  } else if (lnum == 1) {
    keys = line.split(' = ').slice(1)[0].split(/\,\s?(?![^\(]*\))/);

    keys.forEach(function(a) {
      keyLists.push(makeTuple(a)[0]);
    });

    // console.log(keyLists);

    //TODO:
    // check to see if entries can be combined into one
    keyLists.forEach(async function(tuple) {
      if (tuple.length === 3) {
        [key1, key2, flt] = tuple;

        const keyPair = key1 + "_" + key2;

        // console.log(tuple);

        if (!test.has(keyPair)) {
          test.set(keyPair, []);
        }


        test.get(keyPair).push(parseFloat(flt));
      }
    });

    for (let [key, value] of test.entries()) {
      test.set(key, groupEntries(value));
    }

    console.log(test);
  }

  if (lnum < 2) {
    lnum++;
  } else {
    lnum = 0;
    keyLists = [];
    test.clear();
  }
});

// let minFloat = parseFloat(flt) - 0.01;
// let maxFloat = parseFloat(flt) + 0.01;

// console.log(key1 + "_" + key2 + ": (" + minFloat + "-" + maxFloat + ") " + value);

// const newConfig = await pool.query("INSERT INTO configuration " +
//   "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
//   [key1, key2, minFloat, maxFloat, value]);

// console.log(newConfig.rows[0]);
