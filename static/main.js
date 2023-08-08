"use strict";

/* just so we're clear, all flags are valid;
 * these flags are specifically valid here because
 * they have a one-to-one correspondence between a color and a descriptor of the flag,
 * or can be truncated to be that (e.g. the tra in trans)
 *
 * sorted in priority order; e.g. the n in lesbian takes priority over the n in enby
 */
const validFlags = [
  {
    name: "lesbian", // lesbian
    colors: [
      "#D62900",
      "#F07722",
      "#FF9B55",
      "#FFFFFF",
      "#D262A6",
      "#B75591",
      "#A50062",
    ],
    stripeWidth: 1 / 7,
  },
  {
    name: "enby", // y
    colors: ["#FCF431", "#FCFCFC", "#9D59D2", "#282828"],
    stripeWidth: 1 / 4,
  },
  {
    name: "pan", // p
    colors: ["#FF1C8D", "#FFD700", "#1AB3FF"],
    stripeWidth: 1 / 3,
  },
  {
    name: "fluid", // fud, genderfluid, not gender solid
    colors: ["#FE76A2", "#FFFFFF", "#BF12D7", "#000000", "#303CBE"],
    stripeWidth: 1 / 5,
  },
  {
    name: "trans", // tr, trans, only using t/r/a because of repeated color usage
    colors: ["#5BCFFB", "#F5ABB9", "#FFFFFF", "#F5ABB9", "#5BCFFB"],
    stripeWidth: 1 / 5,
  },
  {
    name: "demiboy", // mo
    colors: [
      "#808080",
      "#C4C4C4",
      "#9AD9EB",
      "#FFFFFF",
      "#9AD9EB",
      "#C4C4C4",
      "#808080",
    ],
    stripeWidth: 1 / 7,
  },
  {
    name: "cupio", // c
    colors: ["#FCA9A3", "#FDC5C0", "#FFFFFF", "#C8BFE6", "#A0A0A0"],
    stripeWidth: 1 / 5,
  },
  {
    name: "vincian", // v
    colors: [
      "#078D70",
      "#26CEAA",
      "#98E8C1",
      "#FFFFFF",
      "#7BADE2",
      "#5049CC",
      "#3D1A78",
    ],
    stripeWidth: 1 / 7,
  },
];

const uniqueLetters = validFlags
  .map((flag) => flag.name.split(""))
  .flat()
  .filter(
    (value, index, list) => list.indexOf(value) === index
    // checks for if it is the first instance
  )
  .sort();

const validationRegex =
  "[" +
  uniqueLetters.join("") +
  uniqueLetters.map((c) => c.toUpperCase()).join("") +
  "]+";

function inputStringToColors(input) {
  return input.split("").map((letter) => {
    const flag = validFlags.find((flag) => flag.name.includes(letter));
    return {
      color: flag.colors[flag.name.indexOf(letter)],
      stripeWidth: flag.stripeWidth,
    };
  });
}

const FLAG_WIDTH = 1500;
const NORMAL_FLAG_HEIGHT = 1000;

function drawFlag(canvas, ctx, colors) {
  canvas.width = FLAG_WIDTH;

  // calculates the total flag height
  var totalHeight = 0;
  for (var i = 0; i < colors.length; i++) {
    totalHeight += colors[i].stripeWidth * NORMAL_FLAG_HEIGHT - 1;
    // 1 is subtracted so they line up nicely
  }
  canvas.height = totalHeight;

  var currentPosition = 0;

  for (var i = 0; i < colors.length; i++) {
    const stripeWidth = colors[i].stripeWidth * NORMAL_FLAG_HEIGHT;

    ctx.fillStyle = colors[i].color;
    ctx.fillRect(0, currentPosition, FLAG_WIDTH, stripeWidth);

    currentPosition += stripeWidth - 1;
  }
}

function sourceFlagDisplayHtml() {
  let unusedLetters = [...uniqueLetters];
  let output = "";

  for (const flag of validFlags) {
    for (var i = 0; i < flag.colors.length; i++) {
      const color = flag.colors[i];
      const char = flag.name[i];

      if (unusedLetters.includes(char)) {
        output += "<strong><em>";
      }
      output += `<span style="color: ${chooseBlackOrWhite(
        color
      )}; background-color: ${color};">${char}</span>`;
      if (unusedLetters.includes(char)) {
        output += "</em></strong>";
        unusedLetters = unusedLetters.filter((c) => c != char);
      }
    }
    output += "<br>\n";
  }

  return output;
}

window.onload = function () {
  document.getElementById("source-flags").innerHTML = sourceFlagDisplayHtml();

  const startingURL = new URL(window.location.href);
  const searchParams = new URLSearchParams(startingURL.searchParams);

  if (searchParams.get("input") === null) {
    searchParams.set("input", "trbian");
  }

  const input = document.getElementById("desired-words");
  input.pattern = validationRegex;
  input.value = searchParams.get("input");

  input.oninput = function () {
    if (!input.checkValidity()) {
      return;
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFlag(canvas, ctx, inputStringToColors(input.value.toLowerCase()));
  };

  input.onchange = function () {
    searchParams.set("input", input.value);

    window.history.replaceState(
      {},
      "",
      window.location.pathname + "?" + searchParams.toString()
    );
  };

  input.oninput();
};

// https://stackoverflow.com/a/35970186
function chooseBlackOrWhite(hex) {
  if (hex.indexOf("#") === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error("Invalid HEX color.");
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  // https://stackoverflow.com/a/3943023/112731
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF";
}

function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join("0");
  return (zeros + str).slice(-len);
}
