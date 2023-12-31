/**
 * Unescape html tags
 * @param {String} code
 * @returns
 */
export function unescapeHTML(code = "") {
  if (!code) return code;

  return code
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

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

/**
 * Generate array of random numbers
 * @param {Number} length
 * @param {Number} min
 * @param {Number} max
 * @returns {Array}
 */
export function generateData(length = 0, min = 0, max = 100) {
  const series = [];
  const diff = max - min;
  let i = 0;

  while (i < length) {
    const value = Math.floor(Math.random() * (diff + 1)) + min;
    series.push(value);
    i++;
  }
  return series;
}

/**
 * Generate array of random dates
 * @param {Number} length
 * @param {Date} start
 * @param {Number} days
 * @returns {Array}
 */
export function generateDates(length = 0, start = null, days = 1) {
  const dates = [];
  let date = new Date(start || new Date());
  for (let i = 0; i < length; i++) {
    date.setDate(date.getDate() + days);
    dates.push(date.toISOString());
  }
  return dates;
}
