import fg from "fast-glob";
import { utimes } from "utimes";
import fs from "fs";
import * as prettier from "prettier";
import organizeAttributes from "prettier-plugin-organize-attributes";

export function changeTimesAndFormatFiles() {
  return {
    name: "times-and-format-files",
    apply: "build", // or 'serve'
    async closeBundle() {
      const files = fg.globSync("./dist/**/*.html");
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