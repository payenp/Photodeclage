const photoInput = document.querySelector("#photo-input");
const processButton = document.querySelector("#process-button");
const originalImage = document.querySelector("#original-image");
const originalStage = document.querySelector("#original-stage");
const resultStage = document.querySelector("#result-stage");
const resultCanvas = document.querySelector("#result-canvas");
const statusText = document.querySelector("#status");
const fileName = document.querySelector("#file-name");
const verticalToggle = document.querySelector("#vertical-toggle");
const horizontalToggle = document.querySelector("#horizontal-toggle");
const verticalSlider = document.querySelector("#vertical-width");
const horizontalSlider = document.querySelector("#horizontal-height");
const verticalValue = document.querySelector("#vertical-value");
const horizontalValue = document.querySelector("#horizontal-value");
const verticalCard = document.querySelector("#vertical-card");
const horizontalCard = document.querySelector("#horizontal-card");

let sourceUrl = "";
let imageReady = false;
let hasResult = false;
let verticalEnabled = true;
let horizontalEnabled = false;

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Ce fichier n’est pas une image compatible.", false);
    return;
  }

  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  imageReady = false;
  hasResult = false;
  updateProcessButton();

  originalImage.onload = () => {
    imageReady = true;
    originalStage.classList.remove("empty");
    originalStage.classList.add("has-image");
    clearResult();
    fileName.textContent = file.name;
    setStatus("Photo prête — réglez les bandes puis lancez le traitement.", true);
    updateProcessButton();
  };

  originalImage.onerror = () => {
    imageReady = false;
    updateProcessButton();
    setStatus("Impossible d’ouvrir cette photo. Essayez un autre fichier.", false);
  };

  originalImage.src = sourceUrl;
});

verticalToggle.addEventListener("click", () => {
  verticalEnabled = !verticalEnabled;
  updateDirectionControls();
  settingsChanged();
});

horizontalToggle.addEventListener("click", () => {
  horizontalEnabled = !horizontalEnabled;
  updateDirectionControls();
  settingsChanged();
});

verticalSlider.addEventListener("input", () => {
  verticalValue.textContent = verticalSlider.value + " %";
  settingsChanged();
});

horizontalSlider.addEventListener("input", () => {
  horizontalValue.textContent = horizontalSlider.value + " %";
  settingsChanged();
});

processButton.addEventListener("click", () => {
  if (!imageReady || (!verticalEnabled && !horizontalEnabled)) return;

  processButton.disabled = true;
  processButton.textContent = "Traitement…";

  requestAnimationFrame(() => {
    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;
    const verticalBandCount = Math.max(2, Math.round(100 / Number(verticalSlider.value)));
    const horizontalBandCount = Math.max(2, Math.round(100 / Number(horizontalSlider.value)));
    let currentSource = originalImage;

    if (verticalEnabled) {
      const verticalCanvas = document.createElement("canvas");
      reverseVerticalBands(currentSource, verticalCanvas, width, height, verticalBandCount);
      currentSource = verticalCanvas;
    }

    if (horizontalEnabled) {
      reverseHorizontalBands(currentSource, resultCanvas, width, height, horizontalBandCount);
    } else {
      resultCanvas.width = width;
      resultCanvas.height = height;
      resultCanvas.getContext("2d").drawImage(currentSource, 0, 0, width, height);
    }

    hasResult = true;
    resultStage.classList.remove("empty");
    resultStage.classList.add("has-image");
    processButton.replaceChildren(document.createTextNode("Traiter à nouveau"), createArrowIcon());
    updateProcessButton();

    const directions = verticalEnabled && horizontalEnabled
      ? "verticales et horizontales"
      : verticalEnabled
        ? "verticales"
        : "horizontales";
    setStatus("Terminé — bandes " + directions + " inversées.", true);
    resultStage.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

function reverseVerticalBands(source, target, width, height, bandCount) {
  const context = target.getContext("2d");
  target.width = width;
  target.height = height;
  context.clearRect(0, 0, width, height);

  for (let destinationBand = 0; destinationBand < bandCount; destinationBand += 1) {
    const sourceBand = bandCount - 1 - destinationBand;
    const sourceStart = Math.round((sourceBand * width) / bandCount);
    const sourceEnd = Math.round(((sourceBand + 1) * width) / bandCount);
    const destinationStart = Math.round((destinationBand * width) / bandCount);
    const destinationEnd = Math.round(((destinationBand + 1) * width) / bandCount);
    context.drawImage(source, sourceStart, 0, sourceEnd - sourceStart, height, destinationStart, 0, destinationEnd - destinationStart, height);
  }
}

function reverseHorizontalBands(source, target, width, height, bandCount) {
  const context = target.getContext("2d");
  target.width = width;
  target.height = height;
  context.clearRect(0, 0, width, height);

  for (let destinationBand = 0; destinationBand < bandCount; destinationBand += 1) {
    const sourceBand = bandCount - 1 - destinationBand;
    const sourceStart = Math.round((sourceBand * height) / bandCount);
    const sourceEnd = Math.round(((sourceBand + 1) * height) / bandCount);
    const destinationStart = Math.round((destinationBand * height) / bandCount);
    const destinationEnd = Math.round(((destinationBand + 1) * height) / bandCount);
    context.drawImage(source, 0, sourceStart, width, sourceEnd - sourceStart, 0, destinationStart, width, destinationEnd - destinationStart);
  }
}

function updateDirectionControls() {
  verticalToggle.setAttribute("aria-checked", String(verticalEnabled));
  horizontalToggle.setAttribute("aria-checked", String(horizontalEnabled));
  verticalToggle.classList.toggle("active", verticalEnabled);
  horizontalToggle.classList.toggle("active", horizontalEnabled);
  verticalCard.classList.toggle("active", verticalEnabled);
  horizontalCard.classList.toggle("active", horizontalEnabled);
  verticalSlider.disabled = !verticalEnabled;
  horizontalSlider.disabled = !horizontalEnabled;

  if (!verticalEnabled && !horizontalEnabled) {
    setStatus("Activez Vertical, Horizontal, ou les deux.", false);
  }
  updateProcessButton();
}

function settingsChanged() {
  clearResult();
  if (imageReady && (verticalEnabled || horizontalEnabled)) {
    setStatus("Réglages modifiés — appuyez sur « Traiter la photo ».", true);
  }
}

function clearResult() {
  hasResult = false;
  resultStage.classList.remove("has-image");
  resultStage.classList.add("empty");
  updateProcessButton();
}

function updateProcessButton() {
  processButton.disabled = !imageReady || (!verticalEnabled && !horizontalEnabled);
  if (!hasResult && processButton.textContent !== "Traitement…") {
    processButton.replaceChildren(document.createTextNode("Traiter la photo"), createArrowIcon());
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

updateDirectionControls();

window.addEventListener("beforeunload", () => {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
});
