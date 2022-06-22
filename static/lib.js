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
    name: "tra", // tr, trans, only using t/r/a because of repeated color usage
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

export const uniqueLetters = validFlags
  .map((flag) => flag.name.split(""))
  .flat()
  .filter(
    (value, index, list) => list.indexOf(value) === index
    // checks for if it is the first instance
  )
  .sort();

export const validationRegex =
  "[" +
  uniqueLetters.join("") +
  uniqueLetters.map((c) => c.toUpperCase()).join("") +
  "]+";

export function inputStringToColors(input) {
  return input.split("").map((letter) => {
    const flag = validFlags.find((flag) => flag.name.includes(letter));
    return {
      color: flag.colors[flag.name.indexOf(letter)],
      stripeWidth: flag.stripeWidth,
    };
  });
}

export const FLAG_WIDTH = 1500;
export const NORMAL_FLAG_HEIGHT = 1000;

export function calculateRectsAndHeight(colors) {
  var currentPosition = 0;

  const rects = colors.map((color) => {
    const stripeHeight = color.stripeWidth * NORMAL_FLAG_HEIGHT;
    const result = {
      x: 0,
      y: currentPosition,
      width: FLAG_WIDTH,
      height: stripeHeight,
      color: color.color,
    };

    currentPosition += stripeHeight - 1;

    return result;
  });

  return { rects: rects, height: currentPosition };
}
