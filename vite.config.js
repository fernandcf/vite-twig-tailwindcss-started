import { defineConfig } from "vite";
import vituum from "vituum";
import twig from "@vituum/vite-plugin-twig";
import tailwindcss from "@vituum/vite-plugin-tailwindcss";
import {
  changeTimesAndFormatFiles,
  combineShorthandAlpine,
  removeValueBykey,
  merge,
  isObject,
} from "./vite.utils";
import { resolve } from "path";
import { clsx } from "clsx";
import { getDataJSON } from "./src/data";

const dataJSON = getDataJSON(resolve(__dirname, "./src/data"));

export default defineConfig({
  plugins: [
    //
    vituum(),
    tailwindcss(),
    twig({
      root: "./src",
      namespaces: {
        // @component/path/view
        component: resolve(__dirname, "./src/components"),
        // @layout/path/view
        layout: resolve(__dirname, "./src/layouts"),
      },
      functions: {
        replace(str = "", searchValue = "", replaceValue = "") {
          return str.replace(searchValue, replaceValue);
        },
        lower(str) {
          return str.toLowerCase();
        },
        getData(key) {
          const arr = key.split(".");
          const count = arr.length;

          if (count < 2) {
            return key;
          }

          const lastI = count - 1;
          const last = arr[lastI];
          const key_ = arr.filter((v) => v != last).join(".");
          const res = dataJSON[key_];

          if (!res) {
            return key;
          }
          return res[last];
        },
        assign(...sources) {
          return merge(...sources);
        },
        class(...args) {
          args = args.map((a) => removeValueBykey(a));
          return clsx(...args);
        },
        trim(str) {
          return str.trim();
        },
        concat(separator = "", ...strs) {
          return strs.filter((x) => x).join(separator);
        },
        attributes(_context) {
          const ctx = JSON.parse(JSON.stringify(_context));
          const keys = _context._keys || [];
          const myAttrs = keys.reduce((ac, k) => {
            const name = k;
            const value = ctx[k];
            const isArray = Array.isArray(value);
            const isObj = isObject(value);
            if ((value || value === 0) && !isArray && !isObj) {
              ac[name] = value;
              //
              delete _context[name];
            }
            return ac;
          }, {});
        
          return {
            keys,
            skip: [],
            sources: [],
            classes: "",
            class(...args) {
              args = args.map((a) => removeValueBykey(a));
              this.classes = clsx(...args);
              return this;
            },
            overwrite(...objs) {
              this.sources = objs;
              return this;
            },
            toString() {
              const attrs = {};
              for (const key of Object.keys(myAttrs)) {
                if (!this.skip.includes(key)) {
                  attrs[key] = myAttrs[key];
                }
              }

              if (attrs.class)
                attrs.class = (this.classes + " " + attrs.class).trim();

              let combine = merge(attrs, ...this.sources);
              combine = combineShorthandAlpine(combine);

              return Object.entries(combine)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map((o) => {
                  const [name, value] = o;
                  const isBool = typeof value === "boolean";
                  const isValid =
                    typeof value === "number" || typeof value === "string";

                  if (isBool && value) return name;

                  if (isValid) return `${name}="${value}"`;

                  return null;
                })
                .filter((x) => x)
                .join(" ");
            },
            getProps(...keys) {
              const res = {};
              for (const key of keys) {
                if (typeof key === "string") {
                  res[key] = ctx[key];
                  this.skip.push(key);
                }
              }
              return res;
            },
          };
        },
        log(str,...data) {
          console.log(str, ...data);
        },
      },
    }),
    changeTimesAndFormatFiles(),
  ],
});
