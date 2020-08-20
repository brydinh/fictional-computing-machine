const fs = require("fs");
const readline = require("readline");

const pool = require("./db/db");
const logger = require("./config/logger");

function makeTuple(str) {
  return str
    .replace(/\s/g, "")
    .split("),(")
    .map(el => [...el.replace(/[\()\]]/g, '').split(',')]);
}

function getValidEntries(lst) {
  lst.sort((a, b) => (a.flts[0] - b.flts[0]));

  for (i = 0; i < lst.length - 1; i++) {
    // check for overlap
    if (lst[i + 1].flts[0] <= lst[i].flts[1]) {
      logger.error("Conflict at [" + lst[i].flts[0] + ", "+ lst[i].flts[1] + "]"
      + " and [" + lst[i + 1].flts[0] + ", " + lst[i+1].flts[1] + "]");

      lst.splice(i, 2);
    }
  }
  return lst;
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

function getMinMax(lst) {
  if (lst.length === 1) {
    min = lst[0] - 0.01;
    max = lst[0] + 0.01;
  } else {
    const calc = (lst[0] + lst[lst.length - 1]) / 2;
    const center = Math.round(1000 * calc) / 1000;
    min = center - 0.01;
    max = center + 0.01;
  }

  const minFloat = Math.round(1000 * min) / 1000;
  const maxFloat = Math.round(1000 * max) / 1000;

  return [minFloat, maxFloat];
}

function insertDB(map) {
  for (let [key, value] of map.entries()) {
    const [key1, key2] = key.split("_");

    value.forEach(async function(elmt) {
      const {flts, value} = elmt;
      const [minFloat, maxFloat] = flts;

      console.log(key1 + " " + key2 + ": (" + minFloat + "-" + maxFloat + ") " + value);

      // const newConfig = await pool.query("INSERT INTO configuration " +
      //   "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      //   [key1, key2, minFloat, maxFloat, value]);
      //
      // console.log(newConfig.rows[0]);
    });
  }
}

function readFile() {
  let value = "";
  let lnum = 0;
  let map = new Map();

  const lineReader = readline.createInterface({
    input: fs.createReadStream("importExample.cfg")
  });

  // TODO: refactor and optimize code
  lineReader.on("line", function(line) {
      if (lnum === 0) {
        var newVal = line.match(/\[(.*?)\]/);

        if (newVal) {
          value = newVal[1];
        }
      } else if (lnum === 1) {
        let keyLists = [];
        let m = new Map();

        const keyStrings = line.split(' = ').slice(1)[0].split(/\,\s?(?![^\(]*\))/);

        keyStrings.forEach(function(keyString) {
          keyLists.push(makeTuple(keyString)[0]);
        });

        keyLists.forEach(function(tuple) {
          if (tuple.length === 3) {
            [key1, key2, flt] = tuple;
            const keyPair = key1 + "_" + key2;
            if (!m.has(keyPair)) {
              m.set(keyPair, []);
            }
            m.get(keyPair).push(parseFloat(flt));
          } else {
            logger.error(tuple + " does not have 3 entries!");
          }
        });

        for (let [key, val] of m.entries()) {
          const groupedFlts = groupEntries(val);

          groupedFlts.forEach(function(flt) {
            const obj = {
              flts: flt,
              value: value
            }

            if (!map.has(key)) {
              map.set(key, []);
            }

            map.get(key).push(obj);
          });
        }
      }

      if (lnum < 2) {
        lnum++;
      } else {
        lnum = 0;
      }

    })
    .on("close", function() {
      for (let value of map.values()) {
        value.forEach(function(elmt) {
          elmt.flts = getMinMax(elmt.flts);
        });
      }

      for (let [key, value] of map.entries()) {
        map.set(key, getValidEntries(value));
      }

      insertDB(map);
    });
}

readFile();
