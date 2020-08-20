const fs = require("fs");
const readline = require("readline");

const pool = require("./db/db");
const logger = require("./config/logger");

const { performance } = require('perf_hooks');


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
      logger.error("Conflict at [" + lst[i] + "] and [" + lst[i + 1] + "]");
      lst.splice(i, 2);
    }
  }
  return lst;
}

function getValidEntries2(lst) {
  for (i = 0; i < lst.length - 1; i++) {
    // check for overlap
    if (lst[i + 1].minFloat <= lst[i].maxFloat) {
      logger.error("Conflict at [" + lst[i].minFloat + ", " + lst[i].maxFloat + "]" +
        " and [" + lst[i + 1].minFloat + "," + lst[i + 1].maxFloat + "]");
      lst.splice(i, 2);
    }
  }
  return lst;
}

function getMinMax(lst) {
  let minMaxLst = [];
  let indx = 0;

  lst.forEach(function(flts) {
    let min = 0;
    let max = 0;
    minMaxLst.push([]);

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
    minMaxLst[indx].push(minFloat, maxFloat);
    indx++;
  });

  return minMaxLst;
}

function readFile() {
  let test = new Map();
  let kp = new Set();
  let value = "";
  let lnum = 0;

  const lineReader = readline.createInterface({
    input: fs.createReadStream("importExample.cfg")
  });

  // TODO: refactor and optimize code
  lineReader.on("line", function(line) {
      let map = new Map();
      let keyLists = [];

      if (lnum == 0) {
        var newVal = line.match(/\[(.*?)\]/);

        if (newVal) {
          value = newVal[1];
        }
      } else if (lnum == 1) {
        const keys = line.split(' = ').slice(1)[0].split(/\,\s?(?![^\(]*\))/);

        keys.forEach(function(a) {
          keyLists.push(makeTuple(a)[0]);
        });

        // makes sure all tuples has 3 values in it
        keyLists.forEach(function(tuple) {
          if (tuple.length === 3) {
            [key1, key2, flt] = tuple;

            const keyPair = key1 + "_" + key2;
            kp.add(keyPair);

            if (!map.has(keyPair)) {
              map.set(keyPair, []);
            }
            map.get(keyPair).push(parseFloat(flt));
          } else {
            logger.error(tuple + " does not have 3 entries!");
          }
        });

        // calculate min/Max floats and checks for conflict
        for (let [key, val] of map.entries()) {
          const groupedFlts = groupEntries(val);
          const a = getMinMax(groupedFlts);
          const b = getValidEntries(a);
          map.set(key, b);
        }

        test.set(value, map);
      }

      if (lnum < 2) {
        lnum++;
      } else {
        lnum = 0;
      }
    })
    .on("close", function() {
      // console.log(test);
      // console.log(test.get("Model1"));
      // console.log(test.get("Model2"));
      // console.log(test.get("Model3"));
      const frick = [];
      let indx = 0;

      kp.forEach(function(elmt) {
        frick.push([]);
        for (let value of test.keys()) {
          const lol = test.get(value).get(elmt);
          if (lol != null) {
            lol.forEach(function(abs) {
              const [minFloat, maxFloat] = abs
              const dum = {
                key: elmt,
                value: value,
                minFloat: minFloat,
                maxFloat: maxFloat
              };
              frick[indx].push(dum);
            });
          }
        }
        indx++;
      });

      frick.forEach(function(hi) {
        hi.sort((a, b) => (a.minFloat - b.minFloat));
        hi = getValidEntries2(hi);

        hi.forEach(async function(config) {
          const {
            key,
            value,
            minFloat,
            maxFloat
          } = config;

          const [key1, key2] = key.split("_");
          console.log(key1 + " " + key2 + ": (" + minFloat + "-" + maxFloat + ") " + value);
          // const newConfig = await pool.query("INSERT INTO configuration " +
          //   "(key1, key2, minFloat, maxFloat, value) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          //   [key1, key2, minFloat, maxFloat, value]);
          //
          // console.log(newConfig.rows[0]);

        });
      });

    });
}


var t0 = performance.now()
readFile();
var t1 = performance.now()
console.log("Call took " + (t1 - t0) + " milliseconds.")
