import * as lib from "/lib.js";

function drawFlag(canvas, ctx, rectsAndHeight) {
  canvas.width = lib.FLAG_WIDTH;
  canvas.height = rectsAndHeight.height;

  const rects = rectsAndHeight.rects;

  for (var i = 0; i < rects.length; i++) {
    const rect = rects[i];

    ctx.fillStyle = rect.color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

window.onload = function () {
  document.getElementById("allowed-letters").innerHTML +=
    lib.uniqueLetters.join(", ");

  const startingURL = new URL(window.location.href);
  const searchParams = new URLSearchParams(startingURL.searchParams);

  if (searchParams.get("input") === null) {
    searchParams.set("input", "lesbian");
  }

  const input = document.getElementById("desired-words");
  input.pattern = lib.validationRegex;
  input.value = searchParams.get("input");

  input.oninput = function () {
    if (!input.checkValidity()) {
      return;
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFlag(
      canvas,
      ctx,
      lib.calculateRectsAndHeight(
        lib.inputStringToColors(input.value.toLowerCase())
      )
    );
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
