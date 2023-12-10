import { utimes } from "utimes";
import fs from "fs";
import * as prettier from "prettier";
import organizeAttributes from "prettier-plugin-organize-attributes";

import path from "path";
import fglob from "fast-glob";
import { normalizePath } from "vite";
import sizeOf from "image-size";
import { createCanvas } from "canvas";

// https://stackoverflow.com/questions/22943186/html5-canvas-font-size-based-on-canvas-size
function getFontSizeRelative(width) {
  const widthDefault = 800;
  const fontSizeDefault = 100;
  const ratio = fontSizeDefault / widthDefault;
  const cSize = width * ratio;
  return (cSize | 0) + "px sans-serif";
}

function generatePlaceholder(pathInput, pathOutput) {
  // Dimensions for the image
  const { width, height } = sizeOf(pathInput);

  // text
  const textString = `${width}x${height}`;

  // Instantiate the canvas object
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  // Fill the rectangle with gray
  context.fillStyle = "#eee";
  context.fillRect(0, 0, width, height);

  // Set the style of the test and render it to the canvas
  context.font = getFontSizeRelative(width);
  context.textAlign = "center";
  context.fillStyle = "#000";

  // center text
  context.fillText(textString, width / 2, height / 2);

  // Write the image to file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(pathOutput, buffer);
}

/**
 * Replace images with placeholder
 * @param {Object} userOptions
 * @param {String} userOptions.dirInput
 * @param {String} userOptions.dirOutput
 * @param {Function} userOptions.exclude
 */
export function replacePlaceholderImages(userOptions) {
  const { dirInput, dirOutput, exclude } = userOptions || {};

  return {
    name: "generate-placeholder-images",
    apply: "build",
    async generateBundle() {
      const root = process.cwd();
      const dirInput_ = path.resolve(root, dirInput);
      const dirOutput_ = dirOutput ? path.resolve(root, dirOutput) : dirInput_;
      const isEqual = dirInput_ === dirOutput_;
      const allFiles = await fglob(normalizePath(dirInput_) + "/**/*", {
        ignore: "node_modules/**",
      });

      for (const file of allFiles) {
        try {
          const pathFile = path.resolve(root, file);
          const res = fs.lstatSync(pathFile);
          const pathFileOut = pathFile.replace(dirInput_, dirOutput_);

          if (res.isDirectory() && !isEqual) {
            fs.mkdirSync(pathFileOut, { recursive: true });
          }

          if (res.isFile()) {
            const ext = path.extname(pathFile);
            const isImg = [".jpg", ".jpge", ".png"].includes(ext);
            if (isImg) {
              if (typeof exclude === "function" && !exclude(file)) continue;

              generatePlaceholder(pathFile, pathFileOut);
            } else if (!isEqual) {
              fs.copyFileSync(pathFile, pathFileOut);
            }
          }
        } catch (e) {
          // Handle error
          console.error("An error occurred reading the route: " + file, e);
        }
      }
    },
  };
}

export function changeTimesAndFormatFiles() {
  return {
    name: "times-and-format-files",
    apply: "build", // or 'serve'
    async closeBundle() {
      const files = fglob.globSync("./dist/**/*.html");
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