import fg from "fast-glob";
import fs from "fs";
import { resolve } from "path";

export function getDataJSON(cwd) {
  const files = fg.sync("./**/*.json", { cwd });
  let res = {};
  for (const file of files) {
    const key = file.replace(".json", "").replace("/", ".");
    const path = resolve(cwd, "./" + file);
    const data = fs.readFileSync(path, "utf-8");
    res[key] = JSON.parse(data);
  }
  //   console.log(res);
  return res;
}