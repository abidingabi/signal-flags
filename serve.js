import * as lib from "./static/lib.js";
import http from "http";
import fs from "fs";
import { exec } from "child_process";
import url from "url";

function rectsWithHeightToMagickCommand(rectsWithHeight) {
  const command =
    `magick -size ${lib.FLAG_WIDTH}x${rectsWithHeight.height} canvas:transparent ` +
    rectsWithHeight.rects
      .map(
        (rect) =>
          `-fill '${rect.color}'` +
          ` -draw 'rectangle ${rect.x},${rect.y}` +
          ` ${rect.x + rect.width},${rect.y + rect.height}'`
      )
      .join(" ") +
    " webp:-";

  return command;
}

async function magickCommandToWebpBuffer(command, callback) {
  if (command == null) {
    callback(null);
    return;
  }

  exec(command, { encoding: "buffer" }, (error, stdout, stderr) => {
    callback(stdout);
  });
}

const validationRegex = new RegExp(`^${lib.validationRegex}$`);

const requestListener = function (req, res) {
  const parsedURL = url.parse(req.url, true);

  if (parsedURL.pathname === "/") {
    const input = parsedURL.query["input"];

    fs.readFile("./static/index.html", (error, pgResp) => {
      let modifiedHTML = pgResp.toString();
      modifiedHTML = modifiedHTML.replace(
        "<!--replaceme-->",
        input == undefined
          ? "<!--no input in query parameters so no ogp image-->"
          : `<meta property="og:image" content="/generate/${input}.webp" />`
      );

      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(modifiedHTML);
      res.end();
    });
  } else if (/\/generate\/\w+\.webp/.test(parsedURL.pathname)) {
    const input = parsedURL.pathname.split("/")[2].split(".")[0];

    if (!validationRegex.test(input)) {
      res.writeHead(406, { "Content-Type": "text/text" });
      res.end("Invalid characters used!");
      return;
    }

    if (input.length > 15) {
      res.writeHead(406, { "Content-Type": "text/text" });
      res.end("Input too long! Should be under 15 characters.");
      return;
    }

    const magickCommand = rectsWithHeightToMagickCommand(
      lib.calculateRectsAndHeight(lib.inputStringToColors(input.toLowerCase()))
    );

    magickCommandToWebpBuffer(magickCommand, (buffer) => {
      res.writeHead(200, { "Content-Type": "image/webp" });
      res.write(buffer);
      res.end();
    });
  } else {
    const endpoints = {
      "/style.css": "text/css",
      "/main.js": "text/javascript",
      "/lib.js": "text/javascript",
    };

    if (parsedURL.pathname in endpoints) {
      const mimeType = endpoints[parsedURL.pathname];
      fs.readFile("./static" + parsedURL.pathname, (error, pgResp) => {
        res.writeHead(200, { "Content-Type": mimeType });
        res.write(pgResp);

        res.end();
      });
    } else {
      res.writeHead(404);
      res.end("Content not found");
    }
  }
};

const server = http.createServer(requestListener);
server.listen(3000);
