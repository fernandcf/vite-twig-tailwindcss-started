import fg from "fast-glob";
import { utimes } from "utimes";
import fs from "fs";
import * as prettier from "prettier";
import organizeAttributes from "prettier-plugin-organize-attributes";

/**
 * Escape html tags
 * @param {String} code
 * @returns 
 */
export function escapeHTML(code) {
  if (!code) return code;

  return String(code).replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag]
  );
}

/**
 * Replace obfuscated css classes (hash)
 * @param {String} classNames
 */
export function mangleCSSClass(classNames = "") {
  const classes = {};
  return classNames
    .split(" ")
    .map((cls) => classes[cls] || cls)
    .join(" ");
}

/**
 * Merge objects
 * @param  {...any} sources 
 * @returns 
 */
export function merge(...sources) {
  sources = sources.map((x) => x || {});
  return Object.assign(...sources);
}

/**
 * determines if it is an object
 * @param {any} obj 
 * @returns 
 */
export function isObject(obj) {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

/**
 * Remove value from an object using the property name
 * @param {Object} obj
 * @param {Array} keys
 * @returns {Array} of keys
 */
export function removeValueBykey(obj, keys = ["_keys"]) {
  if (isObject(obj)) {
    const res = {};
    for (const key of Object.keys(obj)) {
      if (!keys.includes(key)) {
        res[key] = obj[key];
      }
    }
    return res;
  } else {
    return obj;
  }
}
/**
 * Combine alpinejs HTML attributes using Shorthand Syntax @see https://alpinejs.dev/directives/on#shorthand-syntax
 * for example convert @click a x.on:click
 * @param {Object} obj
 */
export function combineShorthandAlpine(obj) {
  const res = {};
  const keys = Object.keys(obj);
  for (const key of keys) {
    const value = obj[key];
    const str = String(key).trim();
    const isShort = str.startsWith("@");
    const key_ = isShort ? str.replace("@", "x-on:") : str;

    const valueOld = res[key_];
    const exists = typeof valueOld !== "undefined";
    if (exists) {
      const sep = value.endsWith(";") ? "" : ";";
      res[key_] = [value, valueOld].filter((x) => x).join(sep);
    } else {
      res[key_] = typeof value === "string" ? value.trim() : value;
    }
  }
  return res;
}

export function changeTimesAndFormatFiles() {
  return {
    name: "times-and-format-files",
    apply: "build", // or 'serve'
    async closeBundle() {
      const files = fg.globSync("./dist/*.html");
      files.sort((a, b) => b.localeCompare(a));

      let d = new Date(Date.now());
      d.setDate(d.getDate() - 1);

      for (const i in files) {
        const file = files[i];
        const sizeInBytes = fs.statSync(file).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed();

        const hour = d.getHours();
        if (hour > 21 && hour < 7) {
          if (hour <= 23) {
            d.setDate(d.getDate() + 1);
          }
          d.setHours(7);
        }

        const modifiedMs = d.getTime();
        // const modified = d.toString();

        // a human can write 1 kb in 60 seconds
        const secAprox = (sizeInKB / 1) * 60;
        d.setSeconds(d.getSeconds() - secAprox);
        const createdMs = d.getTime();
       
        d.setSeconds(d.getSeconds() - 70);

        const data = fs.readFileSync(file, "utf8").toString();
        let content = await prettier.format(data, {
          parser: "html",
          plugins: [organizeAttributes],
        });

        // remove double line breaks
        content = content.replace(/\n\n/gm, "\n");

        fs.writeFileSync(file, content, { encoding: "utf8" });

        // change the creation time (btime), modified time (mtime), and access time (atime) of files
        await utimes(file, {
          btime: createdMs,
          mtime: modifiedMs,
          atime: undefined,
        });
      }
    },
  };
}
