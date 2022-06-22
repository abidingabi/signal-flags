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

async function magickCommandToBase64(command, callback) {
  if (command == null) {
    callback(null);
    return;
  }

  exec(command, { encoding: "buffer" }, (error, stdout, stderr) => {
    callback("data:image/webp;base64," + stdout.toString("base64"));
  });
}

const requestListener = function (req, res) {
  const parsedURL = url.parse(req.url, true);

  if (parsedURL.pathname === "/") {
    const input = parsedURL.query["input"];

    let magickCommand = null;

    if (input != undefined) {
      magickCommand = rectsWithHeightToMagickCommand(
        lib.calculateRectsAndHeight(lib.inputStringToColors(input))
      );
    }

    magickCommandToBase64(magickCommand, (base64) => {
      fs.readFile("./static/index.html", (error, pgResp) => {
        let modifiedHTML = pgResp.toString();
        if (base64 != null) {
          modifiedHTML = modifiedHTML.replace(
            "<!--replaceme-->",
            `<meta property="og:image" content="${base64}" />`
          );
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(modifiedHTML);
        res.end();
      });
    });
  } else {
    const endpoints = {
      "/index.html": "text/html", // TODO: delete me!
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
    }
  }
};

const server = http.createServer(requestListener);
server.listen(3000);
