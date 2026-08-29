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
const downloadButton = document.querySelector("#download-button");
const downloadMeta = document.querySelector("#download-meta");
const selectionLayer = document.querySelector("#selection-layer");
const selectionBox = document.querySelector("#selection-box");
const effectSide = document.querySelector("#effect-side");
const effectAxis = document.querySelector("#effect-axis");
const selectionHelp = document.querySelector("#selection-help");
const selectionHandles = document.querySelectorAll(".selection-handle");
const symmetryButton = document.querySelector("#symmetry-button");
const symmetrySetting = document.querySelector("#symmetry-setting");
const symmetryLabel = document.querySelector("#symmetry-label");
const mirrorSide = document.querySelector("#mirror-side");
const startAxis = document.querySelector("#start-axis");

let sourceUrl = "";
let imageReady = false;
let hasResult = false;
let verticalEnabled = true;
let horizontalEnabled = false;
let symmetryEnabled = true;
let selection = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
let axisPosition = 0.5;
let greenPosition = 0.1;
let imageBounds = { left: 0, top: 0, width: 0, height: 0 };
let dragState = null;

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
  downloadMeta.textContent = "PNG — même définition que l’original";
  selection = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  axisPosition = 0.5;
  greenPosition = 0.1;
  selectionLayer.hidden = true;
  selectionHelp.hidden = true;
  updateProcessButton();

  originalImage.onload = () => {
    imageReady = true;
    originalStage.classList.remove("empty");
    originalStage.classList.add("has-image");
    clearResult();
    fileName.textContent = file.name;
    downloadMeta.textContent = "PNG — " + originalImage.naturalWidth + " × " + originalImage.naturalHeight + " pixels";
    setStatus("Photo prête — délimitez la zone puis lancez le traitement.", true);
    selectionLayer.hidden = false;
    selectionHelp.hidden = false;
    requestAnimationFrame(updateImageBounds);
    updateProcessButton();
  };

  originalImage.onerror = () => {
    imageReady = false;
    selectionLayer.hidden = true;
    selectionHelp.hidden = true;
    updateProcessButton();
    setStatus("Impossible d’ouvrir cette photo. Essayez un autre fichier.", false);
  };

  originalImage.src = sourceUrl;
});

verticalToggle.addEventListener("click", () => {
  verticalEnabled = !verticalEnabled;
  function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function constrainGreenPosition(axis, green) {
  const minimum = Math.max(0, axis * 2 - 1);
  const maximum = Math.max(minimum, axis - 0.05);
  return clamp(green, minimum, maximum);
}

function updateImageBounds() {
  if (!imageReady || !originalImage.naturalWidth || !originalImage.naturalHeight) return;
  const stageRect = originalStage.getBoundingClientRect();
  const imageRect = originalImage.getBoundingClientRect();
  const naturalRatio = originalImage.naturalWidth / originalImage.naturalHeight;
  const elementRatio = imageRect.width / imageRect.height;
  let width = imageRect.width;
  let height = imageRect.height;
  let left = imageRect.left - stageRect.left;
  let top = imageRect.top - stageRect.top;

  if (naturalRatio > elementRatio) {
    height = width / naturalRatio;
    top += (imageRect.height - height) / 2;
  } else {
    width = height * naturalRatio;
    left += (imageRect.width - width) / 2;
  }

  imageBounds = { left, top, width, height };
  selectionLayer.style.left = left + "px";
  selectionLayer.style.top = top + "px";
  selectionLayer.style.width = width + "px";
  selectionLayer.style.height = height + "px";
  renderSelection();
}

function renderSelection() {
  selectionBox.style.left = selection.x * 100 + "%";
  selectionBox.style.top = selection.y * 100 + "%";
  selectionBox.style.width = selection.width * 100 + "%";
  selectionBox.style.height = selection.height * 100 + "%";
  effectSide.style.left = axisPosition * 100 + "%";
  effectSide.style.right = symmetryEnabled
    ? Math.max(0, 1 - (axisPosition * 2 - greenPosition)) * 100 + "%"
    : "0";
  effectAxis.style.left = axisPosition * 100 + "%";
  mirrorSide.style.left = greenPosition * 100 + "%";
  mirrorSide.style.right = (1 - axisPosition) * 100 + "%";
  startAxis.style.left = greenPosition * 100 + "%";
  effectAxis.setAttribute("aria-valuenow", String(Math.round(axisPosition * 100)));
  startAxis.setAttribute("aria-valuemin", String(Math.round(Math.max(0, axisPosition * 2 - 1) * 100)));
  startAxis.setAttribute("aria-valuemax", String(Math.round((axisPosition - 0.05) * 100)));
  startAxis.setAttribute("aria-valuenow", String(Math.round(greenPosition * 100)));
}

function pointerPosition(event) {
  const rect = originalStage.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - imageBounds.left) / imageBounds.width,
    y: (event.clientY - rect.top - imageBounds.top) / imageBounds.height,
  };
}

function beginDrag(event, mode) {
  if (!imageReady || !imageBounds.width) return;
  event.preventDefault();
  event.stopPropagation();
  const point = pointerPosition(event);
  dragState = {
    mode,
    startX: point.x,
    startY: point.y,
    selection: { ...selection },
    axisPosition,
    greenPosition,
  };
}

symmetryButton.addEventListener("click", () => {
  symmetryEnabled = !symmetryEnabled;
  symmetryButton.setAttribute("aria-pressed", String(symmetryEnabled));
  symmetrySetting.classList.toggle("active", symmetryEnabled);
  symmetryLabel.textContent = symmetryEnabled ? "Symétrie activée" : "Symétrie";
  mirrorSide.hidden = !symmetryEnabled;
  startAxis.hidden = !symmetryEnabled;
  renderSelection();
  settingsChanged();
});

selectionBox.addEventListener("pointerdown", (event) => beginDrag(event, "move"));
effectAxis.addEventListener("pointerdown", (event) => beginDrag(event, "axis"));
selectionHandles.forEach((handle) => {
  handle.addEventListener("pointerdown", (event) => beginDrag(event, handle.dataset.handle));
});

effectAxis.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  axisPosition = clamp(axisPosition + (event.key === "ArrowLeft" ? -0.02 : 0.02), 0.08, 0.95);
  greenPosition = constrainGreenPosition(axisPosition, greenPosition);
  renderSelection();
  clearResult();
  setStatus("Axe rouge déplacé — appuyez sur « Traiter la photo ».", true);
});

startAxis.addEventListener("pointerdown", (event) => beginDrag(event, "green"));
startAxis.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  greenPosition = constrainGreenPosition(
    axisPosition,
    greenPosition + (event.key === "ArrowLeft" ? -0.02 : 0.02),
  );
  renderSelection();
  clearResult();
  setStatus("Départ vert déplacé — appuyez sur « Traiter la photo ».", true);
});

window.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  event.preventDefault();
  const point = pointerPosition(event);
  const dx = point.x - dragState.startX;
  const dy = point.y - dragState.startY;
  const start = dragState.selection;
  const minimumSize = 0.1;

  if (dragState.mode === "axis") {
    axisPosition = clamp(dragState.axisPosition + dx / start.width, 0.08, 0.95);
    greenPosition = constrainGreenPosition(axisPosition, greenPosition);
  } else if (dragState.mode === "green") {
    greenPosition = constrainGreenPosition(
      dragState.axisPosition,
      dragState.greenPosition + dx / start.width,
    );
  } else if (dragState.mode === "move") {
    selection = {
      ...start,
      x: clamp(start.x + dx, 0, 1 - start.width),
      y: clamp(start.y + dy, 0, 1 - start.height),
    };
  } else {
    let left = start.x;
    let top = start.y;
    let right = start.x + start.width;
    let bottom = start.y + start.height;
    if (dragState.mode.includes("w")) left = clamp(start.x + dx, 0, right - minimumSize);
    if (dragState.mode.includes("e")) right = clamp(start.x + start.width + dx, left + minimumSize, 1);
    if (dragState.mode.includes("n")) top = clamp(start.y + dy, 0, bottom - minimumSize);
    if (dragState.mode.includes("s")) bottom = clamp(start.y + start.height + dy, top + minimumSize, 1);
    selection = { x: left, y: top, width: right - left, height: bottom - top };
  }

  renderSelection();
  clearResult();
  setStatus("Zone modifiée — appuyez sur « Traiter la photo ».", true);
}, { passive: false });

window.addEventListener("pointerup", () => { dragState = null; });
window.addEventListener("pointercancel", () => { dragState = null; });
window.addEventListener("resize", updateImageBounds);

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
    const selectionLeft = Math.round(selection.x * width);
    const selectionTop = Math.round(selection.y * height);
    const selectionRight = Math.round((selection.x + selection.width) * width);
    const selectionBottom = Math.round((selection.y + selection.height) * height);
    const effectLeft = Math.round(selectionLeft + axisPosition * (selectionRight - selectionLeft));
    const greenLeft = Math.round(selectionLeft + greenPosition * (selectionRight - selectionLeft));
    const effectWidth = symmetryEnabled
      ? Math.max(2, effectLeft - greenLeft)
      : Math.max(2, selectionRight - effectLeft);
    const effectHeight = Math.max(2, selectionBottom - selectionTop);
    const verticalBandCount = Math.max(2, Math.min(effectWidth, Math.round(100 / Number(verticalSlider.value))));
    const horizontalBandCount = Math.max(2, Math.min(effectHeight, Math.round(100 / Number(horizontalSlider.value))));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = effectWidth;
    cropCanvas.height = effectHeight;
    cropCanvas.getContext("2d").drawImage(
      originalImage,
      effectLeft,
      selectionTop,
      effectWidth,
      effectHeight,
      0,
      0,
      effectWidth,
      effectHeight,
    );
    let currentSource = cropCanvas;

    if (verticalEnabled) {
      const verticalCanvas = document.createElement("canvas");
      reverseVerticalBands(currentSource, verticalCanvas, effectWidth, effectHeight, verticalBandCount);
      currentSource = verticalCanvas;
    }

    const processedCanvas = document.createElement("canvas");
    if (horizontalEnabled) {
      reverseHorizontalBands(currentSource, processedCanvas, effectWidth, effectHeight, horizontalBandCount);
    } else {
      processedCanvas.width = effectWidth;
      processedCanvas.height = effectHeight;
      processedCanvas.getContext("2d").drawImage(currentSource, 0, 0, effectWidth, effectHeight);
    }

    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultContext = resultCanvas.getContext("2d");
    resultContext.drawImage(originalImage, 0, 0, width, height);
    resultContext.drawImage(processedCanvas, effectLeft, selectionTop, effectWidth, effectHeight);

    if (symmetryEnabled) {
      resultContext.save();
      resultContext.beginPath();
      resultContext.rect(greenLeft, selectionTop, Math.max(0, effectLeft - greenLeft), effectHeight);
      resultContext.clip();
      resultContext.translate(effectLeft * 2, 0);
      resultContext.scale(-1, 1);
      resultContext.drawImage(processedCanvas, effectLeft, selectionTop, effectWidth, effectHeight);
      resultContext.restore();
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
    setStatus(
      "Terminé — bandes " + directions + " inversées dans la zone choisie" +
      (symmetryEnabled ? " avec symétrie autour de l’axe vertical." : "."),
      true,
    );
    resultStage.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

downloadButton.addEventListener("click", () => {
  if (!hasResult) return;

  resultCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus("Impossible de préparer le téléchargement.", false);
      return;
    }

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const originalName = fileName.textContent || "photo";
    const baseName = originalName.replace(/\.[^.]+$/, "");
    link.href = downloadUrl;
    link.download = baseName + "-decalage.png";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setStatus("Image téléchargée en " + resultCanvas.width + " × " + resultCanvas.height + " pixels.", true);
  }, "image/png");
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
  downloadButton.disabled = !hasResult;
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
