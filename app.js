const photoInput = document.querySelector("#photo-input");
const processButton = document.querySelector("#process-button");
const originalImage = document.querySelector("#original-image");
const originalStage = document.querySelector("#original-stage");
const resultStage = document.querySelector("#result-stage");
const resultCanvas = document.querySelector("#result-canvas");
const statusText = document.querySelector("#status");
const fileName = document.querySelector("#file-name");

const BAND_COUNT = 16;
let sourceUrl = "";

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Ce fichier n’est pas une image compatible.", false);
    return;
  }

  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);

  originalImage.onload = () => {
    originalStage.classList.remove("empty");
    originalStage.classList.add("has-image");
    resultStage.classList.remove("has-image");
    resultStage.classList.add("empty");
    processButton.disabled = false;
    fileName.textContent = file.name;
    setStatus("Photo prête — appuyez sur « Traiter la photo ».", true);
  };

  originalImage.onerror = () => {
    processButton.disabled = true;
    setStatus("Impossible d’ouvrir cette photo. Essayez un autre fichier.", false);
  };

  originalImage.src = sourceUrl;
});

processButton.addEventListener("click", () => {
  if (!originalImage.complete || !originalImage.naturalWidth) return;

  processButton.disabled = true;
  processButton.textContent = "Traitement…";

  requestAnimationFrame(() => {
    reverseVerticalBands(originalImage, resultCanvas, BAND_COUNT);
    resultStage.classList.remove("empty");
    resultStage.classList.add("has-image");
    processButton.replaceChildren(
      document.createTextNode("Traiter à nouveau"),
      createArrowIcon(),
    );
    processButton.disabled = false;
    setStatus(`Terminé — la photo a été découpée en ${BAND_COUNT} bandes inversées.`, true);
    resultStage.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

function reverseVerticalBands(image, canvas, bandCount) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  for (let destinationBand = 0; destinationBand < bandCount; destinationBand += 1) {
    const sourceBand = bandCount - 1 - destinationBand;
    const sourceStart = Math.round((sourceBand * width) / bandCount);
    const sourceEnd = Math.round(((sourceBand + 1) * width) / bandCount);
    const destinationStart = Math.round((destinationBand * width) / bandCount);
    const destinationEnd = Math.round(((destinationBand + 1) * width) / bandCount);

    context.drawImage(
      image,
      sourceStart,
      0,
      sourceEnd - sourceStart,
      height,
      destinationStart,
      0,
      destinationEnd - destinationStart,
      height,
    );
  }
}

function setStatus(message, ready) {
  statusText.textContent = message;
  statusText.classList.toggle("ready", ready);
}

function createArrowIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M5 12h14m-5-5 5 5-5 5");
  svg.append(path);
  return svg;
}

window.addEventListener("beforeunload", () => {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
});
