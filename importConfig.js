const fs = require("fs");
const readline = require("readline");
const pool = require("./db/db");

let value = "";
let lnum = 0;
let keyLists = [];
let map = new Map();

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

function getValidEntries(lst) {
  for (i = 0; i < lst.length - 1; i++) {
    // check for overlap
    if (lst[i + 1][0] <= lst[i][1]) {
      console.log("Conflict at [" + lst[i] + "] and [" + lst[i + 1] + "]");
      lst.splice(i, 2);
    }
  }
  return lst;
}

function getMinMax(lst) {
  let test = [];
  let indx = 0;

  lst.forEach(function(flts) {
    let min = 0;
    let max = 0;
    test.push([]);

    if (flts.length === 1) {
      min = flts[0] - 0.01;
      max = flts[0] + 0.01;
    } else {
      const calc = (flts[0] + flts[flts.length - 1]) / 2;
      const center = Math.round(1000 * calc) / 1000;
      min = center - 0.01;
      max = center + 0.01;
    }

    const minFloat = Math.round(1000 * min) / 1000;
    const maxFloat = Math.round(1000 * max) / 1000;
    test[indx].push(minFloat, maxFloat);
    indx++;
  });

  return test;
}

const lineReader = readline.createInterface({
  input: fs.createReadStream("importExample.cfg")
});

// TODO: Account for existing configuration
// for diff val edge case and refactor code
lineReader.on('line', function(line) {
  if (lnum == 0) {
    var newVal = line.match(/\[(.*?)\]/);

    if (newVal) {
      value = newVal[1];
    }
    // console.log(value);

  } else if (lnum == 1) {
    keys = line.split(' = ').slice(1)[0].split(/\,\s?(?![^\(]*\))/);

    // console.log(keys);

    keys.forEach(function(a) {
      keyLists.push(makeTuple(a)[0]);
    });

    // console.log(keyLists);

    // makes sure all tuples has 3 values in it
    keyLists.forEach(function(tuple) {
      if (tuple.length === 3) {
        [key1, key2, flt] = tuple;

        const keyPair = key1 + "_" + key2;

        if (!map.has(keyPair)) {
          map.set(keyPair, []);
        }
        map.get(keyPair).push(parseFloat(flt));
      }
    });

    // console.log(map);

    for (let [key, val] of map.entries()) {
      const groupedFlts = groupEntries(val);
      const a = getMinMax(groupedFlts);
      const b = getValidEntries(a);

      b.forEach(async function(flts) {
        const [minFloat, maxFloat] = flts;
        const [key1, key2] = key.split("_");

        // console.log(key1 + " " + key2 + ": (" + minFloat + "-" + maxFloat + ") " + value);

        const newConfig = await pool.query("INSERT INTO configuration " +
          "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [key1, key2, minFloat, maxFloat, value]);

        console.log(newConfig.rows[0]);
      });
    }
  }

  if (lnum < 2) {
    lnum++;
  } else {
    lnum = 0;
    keyLists = [];
    map.clear();
  }
});
