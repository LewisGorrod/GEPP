
import {
    h2d,
    d2h,
    h2a,
    intArrayToHexArray,
    toGridPos,
    indexToGridPos,
    objectCoordsToPixelPos,
    toObjectCoords,
    printArrayFormatted
} from "./utils.js";

window.createNew = createNew;
window.updateCanvas = updateCanvas;
window.downloadFile = downloadFile;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasBoundingRect = canvas.getBoundingClientRect();

const fileInput = document.getElementById("fileInput");
const levelNameInput = document.getElementById("levelNameInput");
const gameModeSelect = document.getElementById("gameModeSelect");
const gridCheckbox = document.getElementById("gridCheckbox");
const gridSizeRadio2 = document.getElementById("gridSizeRadio2");
const gridSizeRadio3 = document.getElementById("gridSizeRadio3");
const centerLinesCheckbox = document.getElementById("centerLinesCheckbox");
const doorSwitchLinesCheckbox = document.getElementById("showExitDoorSwitch");
const tileModeRadio = document.getElementById("tileModeRadio");
const objectModeRadio = document.getElementById("objectModeRadio");
const tileSelect = document.getElementById("tileSelect");
const objectSelect = document.getElementById("objectSelect");
const objectDirectionSelect = document.getElementById("objectDirectionSelect");

const canvasWidth = 1512;
const canvasHeight = 828;
export const gridWidth = 42;
const gridHeight = 23;
export const tileSize = canvasWidth / gridWidth;
export const quarterTileSize = tileSize / 4;

const tileSprites = new Image;
tileSprites.src = "tiles.png";
const objectSprites = new Image;
objectSprites.src = "objects.png";

let mouseX = 0;
let mouseY = 0;
let mouseButton = 0;
let mouseDownIntervalId;
let tileArray = [];
let hexArray = [];
let tileSpritesIndices = [null, 6, 12, 14, 15, 16, 17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 21, 26, 22, 27, 24, 23, 25, 28, 31, 29, 7, 8, 9, 10, 13, 11, 30, 32];
let objectCounts = [];
let objectData = [];

fileInput.addEventListener("change", event => {
    let file = event.target.files[0];
    let reader = new FileReader();
	reader.addEventListener("loadend", event => {
        loadFile(event.target.result);
	})
	reader.readAsArrayBuffer(file);
});

canvas.addEventListener("contextmenu", event => event.preventDefault());

canvas.addEventListener("mousedown", MouseEvent => {
    mouseButton = MouseEvent.button;
    clearInterval(mouseDownIntervalId);
    mouseDownIntervalId = setInterval(mouseDown);
});

canvas.addEventListener("mouseup", () => clearInterval(mouseDownIntervalId));

canvas.addEventListener("mousemove", MouseEvent => {
	mouseX = MouseEvent.clientX - canvasBoundingRect.left;
	mouseY = MouseEvent.clientY - canvasBoundingRect.top;
});

document.addEventListener("keydown", event => keyDown(event.code));

function mouseDown() {
    let gridPos = toGridPos(mouseX, mouseY);
    if (tileModeRadio.checked) {
        if (mouseButton == 0) {
            tileArray[gridPos[1]][gridPos[0]] = tileSelect.value;
        } else {
            tileArray[gridPos[1]][gridPos[0]] = "00";
        }
    } else if (objectModeRadio.checked) {
        let objectCoords = toObjectCoords(mouseX, mouseY);
        if (mouseButton == 0) {
            let object = [objectSelect.value, d2h(objectCoords[0]), d2h(objectCoords[1]), objectDirectionSelect.value, "00"];
            if (!isObjectInObjectData(object)) {
                objectData.push(object);
            }
        } else {
            removeAllObjectsAt(objectCoords[0], objectCoords[1]);
        }
    }
    updateCanvas();
}

function keyDown(keyCode) {
    let keyCodes = ["KeyD", "KeyC", "KeyS", "KeyZ", "KeyA", "KeyQ", "KeyW", "KeyE"];
    if (keyCodes.includes(keyCode)) {
        objectDirectionSelect.value = d2h(keyCodes.indexOf(keyCode));
    } else if (keyCode == "Space") {
        if (objectModeRadio.checked) {
            objectModeRadio.checked = false;
            tileModeRadio.checked = true;
        } else {
            objectModeRadio.checked = true;
            tileModeRadio.checked = false;
        }
    } else if (keyCode == "KeyG") {
        gridCheckbox.checked = !gridCheckbox.checked;
        updateCanvas();
    }
}

function downloadFile() {
    if (hexArray.length > 0) {
        let arrayBuffer = new ArrayBuffer(hexArray.length);
        let uInt8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < hexArray.length; i++) {
            uInt8Array[i] = h2d(hexArray[i]);
        }
        let link = document.createElement("a");
        let file = new Blob([uInt8Array], {type: "application/octet-stream"});
        link.href = URL.createObjectURL(file);
        link.download = "test";
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

// initialization

function initTileArray() {
    tileArray = [];
    for (let y = 0; y < 23; y++) {
        let tmp = [];
        for (let x = 0; x < gridWidth; x++) {
            tmp.push(0);
        }
        tileArray.push(tmp);
    }
}

// file reading/writing

function isCanvasInUse() {
    for (let y = 0; y < 23; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (tileArray[y][x] != "00") {
                return true;
            }
        }
    }
    return false;
}

function isObjectInObjectData(object) {
    for (let i = 0; i < objectData.length; i++) {
        if (object.toString() == objectData[i].toString()) {
            return true;
        }
    }
    return false;
}

function createNew() {
    let reset = true;
    if (isCanvasInUse() || objectData.length > 0) {
        reset = confirm("Hol' up! This will erase everything on the canvas. Are you sure you want to continue?");
    }
    if (reset) {
        fileInput.value = null;
        initTileArray();
        levelNameInput.value = "Untitled-1";
        gameModeSelect.value = "04";
        tileSelect.value = "01";
        fileSizeLabel.innerHTML = "File size: unknown";
        objectCounts = [];
        objectData = [];
        updateCanvas();
    }
}

function loadFile(arrayBuffer) {
    console.clear();
    hexArray = intArrayToHexArray(new Uint8Array(arrayBuffer));
    printArrayFormatted("hexArray:", hexArray);
    printArrayFormatted("meta data:", getMetaData());
    levelNameInput.value = getLevelName();
    gameModeSelect.value = getGameMode();
    fileSizeLabel.innerHTML = "File size: " + h2d(getFileSize()) + "B";
    loadObjectCounts();
    loadObjectData();
    loadTiles();
    updateCanvas();
}

function getLevelName() {
    let levelName = "";
    for (let i = h2d("26"); i <= h2d("a5"); i++) {
        if (hexArray[i] != "00") {
            levelName += h2a(hexArray[i]);
        }
    }
    return levelName;
}

function getMetaData() {
    return hexArray.slice(h2d("00"), h2d("a6"));
}

function loadTiles() {
    initTileArray();
    let gridPos;
    for (let i = h2d("b8"); i <= h2d("47d"); i++) {
        gridPos = indexToGridPos(i - h2d("b8"));
        if (hexArray[i] != "00") {
            tileArray[gridPos[1]][gridPos[0]] = hexArray[i];
        }
    }
}

// note: doesn't seem to count locked and trap door switches?
function loadObjectCounts() {
    objectCounts = [];
    for (let i = h2d("47e"); i <= h2d("4cd"); i += 2) {
        let hex = hexArray[i + 1] + hexArray[i];
        let decimal = h2d(hex);
        objectCounts.push(decimal);
    }
}

function getFileSize() {
    return hexArray.slice(4, 8).reverse().join("");
}

function loadObjectData() {
    objectData = [];
    let fileSize = getFileSize();
    for (let i = h2d("4ce"); i < h2d(fileSize); i += 5) {
        let object = [hexArray[i], hexArray[i + 1], hexArray[i + 2], hexArray[i + 3], hexArray[i + 4]];
        objectData.push(object);
    }
}

function getGameMode() {
    return hexArray[h2d("0c")];
}

// draw to canvas

function updateCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawGrid();
    drawObjects();
    drawTiles();
    if (doorSwitchLinesCheckbox.checked) {
        drawDoorSwitchLines();
    }
    if (centerLinesCheckbox.checked) {
        drawCenterLines();
    }
}

function drawGrid() {
    if (gridCheckbox.checked) {
        if (gridSizeRadio2.checked || gridSizeRadio3.checked) {
            drawFeintGrid(2);
            if (gridSizeRadio3.checked) {
                drawFeintGrid(4);
                drawFeintGrid(4 / 3);
            }
        }
        ctx.fillStyle = "#a3aa9d";
        for (let x = tileSize - 1; x < canvasWidth - 1; x += tileSize) {
            ctx.fillRect(x, 0, 2, canvasHeight);
        }
        for (let y = tileSize - 1; y < canvasHeight - 1; y += tileSize) {
            ctx.fillRect(0, y, canvasWidth, 2);
        }
    }
}

function drawFeintGrid(offset) {
    ctx.fillStyle = "#99a093";
    for (let x = tileSize / offset; x < canvasWidth; x += tileSize) {
        ctx.fillRect(x, 0, 1, canvasHeight);
    }
    for (let y = tileSize / offset; y < canvasHeight; y += tileSize) {
        ctx.fillRect(0, y, canvasWidth, 1);
    }
}

function drawCenterLines() {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(0, canvasHeight / 2, canvasWidth, 2);
    ctx.fillRect(canvasWidth / 2, 0, 2, canvasHeight);
}

function drawObjects() {
    for (let i = 0; i < objectData.length; i++) {
        let object = objectData[i];
        let spriteY = h2d(object[0]);
        let spriteX = h2d(object[3]);
        let gridX = (h2d(object[1]) - 4) * quarterTileSize;
        let gridY = (h2d(object[2]) - 4) * quarterTileSize;
        ctx.drawImage(objectSprites, spriteX * 44, spriteY * 44, 44, 44, gridX - (tileSize / 2), gridY - (tileSize / 2), tileSize, tileSize);
    }
}

function drawTiles() {
    for (let gridY = 0; gridY < gridHeight; gridY++) {
        for (let gridX = 0; gridX < gridWidth; gridX++) {
            let tileId = tileArray[gridY][gridX];
            if (tileId != "00") {
                let spriteIndex = tileSpritesIndices[h2d(tileId)];
                ctx.drawImage(tileSprites, spriteIndex * 44, 0, 44, 44, gridX * tileSize, gridY * tileSize, tileSize, tileSize);
            }
        }
    }
}

function getObjectsOfId(id) {
    let objects = [];
    for (let i = 0; i < objectData.length; i++) {
        let object = objectData[i];
        if (object[0] == id) {
            objects.push(object);
        }
    }
    return objects;
}

function drawDoorSwitchLines() {
    let ids = ["03", "04", "06", "07", "08", "09"];
    ctx.strokeStyle = "#ffffff";
    for (let j = 0; j < ids.length; j += 2) {
        let exits = getObjectsOfId(ids[j]);
        let exitSwitches = getObjectsOfId(ids[j + 1]);
        for (let i = 0; i < exits.length; i++) {
            let exitPos = objectCoordsToPixelPos([exits[i][1], exits[i][2]]);
            let exitSwitchPos = objectCoordsToPixelPos([exitSwitches[i][1], exitSwitches[i][2]]);
            ctx.beginPath();
            ctx.moveTo(exitPos[0], exitPos[1]);
            ctx.lineTo(exitSwitchPos[0], exitSwitchPos[1]);
            ctx.stroke();
        }
    }
}

function removeAllObjectsAt(objectX, objectY) {
    for (let i = 0; i < objectData.length; i++) {
        if (objectData[i][1] == d2h(objectX) && objectData[i][2] == d2h(objectY)) {
            objectData.splice(i, 1);
            i--;
        }
    }
}

initTileArray();
drawGrid();