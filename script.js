
const canvas = document.getElementById("canvas");
const rect = canvas.getBoundingClientRect();

import {
    clearCanvas,
    drawGrid,
    drawTiles,
    drawObjects,
    drawCenterLines,
    drawDoorSwitchLines
} from "./canvas.js";

import {
    h2d,
    d2h,
    h2a,
    a2h,
    intArrayToHexArray,
    toGridPos,
    indexToGridPos,
    toObjectCoords,
    printArrayFormatted,
    formatHex
} from "./utils.js";

window.createNew = createNew;
window.updateCanvas = updateCanvas;
window.downloadFile = downloadFile;
window.inputPreview = inputPreview;
window.outputPreview = outputPreview;

const fileInput = document.getElementById("fileInput");
const levelNameInput = document.getElementById("levelNameInput");
const gameModeSelect = document.getElementById("gameModeSelect");
const fileSizeLabel = document.getElementById("fileSizeLabel");
const gridCheckbox = document.getElementById("gridCheckbox");
const gridSizeHalfRadio = document.getElementById("gridSizeRadioHalf");
const gridSizeQuarterRadio = document.getElementById("gridSizeRadioQuarter");
const centerLinesCheckbox = document.getElementById("centerLinesCheckbox");
const doorSwitchLinesCheckbox = document.getElementById("showExitDoorSwitch");
const tileModeRadio = document.getElementById("tileModeRadio");
const objectModeRadio = document.getElementById("objectModeRadio");
const tileSelect = document.getElementById("tileSelect");
const objectSelect = document.getElementById("objectSelect");
const objectDirectionSelect = document.getElementById("objectDirectionSelect");
const droneModeSelect = document.getElementById("droneModeSelect");
const tilesOntopRadio = document.getElementById("tilesOntopRadio");

let mouseX = 0;
let mouseY = 0;
let mouseButton = 0;
let mouseDownIntervalId;

let hexArray = [];
let tileArray = [];
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

canvas.addEventListener("mouseup", () => {
    clearInterval(mouseDownIntervalId);
});

canvas.addEventListener("mousemove", MouseEvent => {
	mouseX = MouseEvent.clientX - rect.left;
	mouseY = MouseEvent.clientY - rect.top;
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
            if (["0c", "0d", "0e", "0f", "17", "1a".includes(object[0])]) {
                object[4] = droneModeSelect.value;
            }
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
    let objectDirectionkeyCodes = ["KeyD", "KeyC", "KeyS", "KeyZ", "KeyA", "KeyQ", "KeyW", "KeyE"];
    if (objectDirectionkeyCodes.includes(keyCode)) {
        objectDirectionSelect.value = d2h(objectDirectionkeyCodes.indexOf(keyCode));
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

function loadFile(arrayBuffer) {
    hexArray = intArrayToHexArray(new Uint8Array(arrayBuffer));
    levelNameInput.value = getLevelName();
    gameModeSelect.value = getGameMode();
    fileSizeLabel.innerHTML = "File size: " + h2d(getFileSize()) + "B";
    loadObjectData();
    loadTiles();
    updateCanvas();
}

function inputPreview() {
    console.clear();
    printArrayFormatted("tile data:", tileArray);
    console.log("object data:")
    for (let i = 0; i < objectData.length; i++) {
        console.log(objectData[i]);
    }
    console.log(orderObjectData());
}

function outputPreview() {
    console.clear()
    printArrayFormatted("input hex array (" + hexArray.length + "):", hexArray);
    let newHexArray = genNewHexArray(true);
}

function downloadFile() {
    let hexArray = genNewHexArray(false);
    if (hexArray.length > 0 && isCanvasInUse()) {
        let arrayBuffer = new ArrayBuffer(hexArray.length);
        let uInt8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < hexArray.length; i++) {
            uInt8Array[i] = h2d(hexArray[i]);
        }
        let link = document.createElement("a");
        let file = new Blob([uInt8Array], {type: "application/octet-stream"});
        link.href = URL.createObjectURL(file);
        link.download = levelNameInput.value;
        link.click();
        URL.revokeObjectURL(link.href);
    } else {
        alert("Computer says no...");
    }
}

function createNew() {
    let reset = true;
    if (isCanvasInUse() || objectData.length > 0) {
        reset = confirm("Hol' up! This will erase everything on the canvas. Are you sure you want to continue?");
    }
    if (reset) {
        fileInput.value = null;
        tileArray = [];
        for (let y = 0; y < 23; y++) {
            let tmp = [];
            for (let x = 0; x < 42; x++) {
                tmp.push("00");
            }
            tileArray.push(tmp);
        }
        levelNameInput.value = "Untitled-1";
        gameModeSelect.value = "04";
        tileSelect.value = "01";
        fileSizeLabel.innerHTML = "File size: unknown";
        tilesOntopRadio.checked = true;
        objectData = [];
        updateCanvas();
    }
}

function updateCanvas() {
    clearCanvas();
    if (gridCheckbox.checked) {
        if (gridSizeHalfRadio.checked) {
            drawGrid(1);
        } else if (gridSizeQuarterRadio.checked) {
            drawGrid(2);
        } else {
            drawGrid(0);
        }
    }
    if (tilesOntopRadio.checked) {
        drawObjects(objectData);
        drawTiles(tileArray);
    } else {
        drawTiles(tileArray);
        drawObjects(objectData);
    }
    if (doorSwitchLinesCheckbox.checked) {
        drawDoorSwitchLines();
    }
    if (centerLinesCheckbox.checked) {
        drawCenterLines();
    }
}

// getting stuff from hexArray

function getFileSize() {
    return hexArray.slice(4, 8).reverse().join("");
}

function getGameMode() {
    return hexArray[h2d("0c")];
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

// getting stuff from hexArray AND setting global variables

function loadTiles() {
    let gridPos;
    for (let i = h2d("b8"); i <= h2d("47d"); i++) {
        gridPos = indexToGridPos(i - h2d("b8"));
        tileArray[gridPos[1]][gridPos[0]] = hexArray[i];
    }
}

function loadObjectData() {
    objectData = [];
    let fileSize = getFileSize();
    for (let i = h2d("4ce"); i < h2d(fileSize); i += 5) {
        let object = [hexArray[i], hexArray[i + 1], hexArray[i + 2], hexArray[i + 3], hexArray[i + 4]];
        objectData.push(object);
    }
}

// reading/modifying global variables

function removeAllObjectsAt(objectX, objectY) {
    for (let i = 0; i < objectData.length; i++) {
        if (objectData[i][1] == d2h(objectX) && objectData[i][2] == d2h(objectY)) {
            objectData.splice(i, 1);
            i--;
        }
    }
}

export function getObjectsOfId(id) {
    let objects = [];
    for (let i = 0; i < objectData.length; i++) {
        let object = objectData[i];
        if (object[0] == id) {
            objects.push(object);
        }
    }
    return objects;
}

function isCanvasInUse() {
    if (tileArray.length > 0) {
        for (let y = 0; y < 23; y++) {
            for (let x = 0; x < 42; x++) {
                if (tileArray[y][x] != "00") {
                    return true;
                }
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

// formatting global variables (for new hexArray)

function tileArrayToHexArray(tileArray) {
    let hexArray = [];
    for (let i = 0; i < tileArray.length; i++) {
        hexArray = hexArray.concat(tileArray[i]);
    }
    return hexArray;
}

function orderObjectData() {
    let orderedObjectData = [];
    let newObjectData = [];
    for (let i = 0; i < 29; i++) {
        orderedObjectData.push([]);
    }
    for (let i = 0; i < objectData.length; i++) {
        let object = objectData[i];
        orderedObjectData[h2d(object[0])].push(object);
    }
    for (let i = 0; i < 6; i++) {
        newObjectData = newObjectData.concat(orderedObjectData[i]);
    }
    for (let i = 0; i < orderedObjectData[6].length; i++) {
        newObjectData.push(orderedObjectData[6][i]);
        newObjectData.push(orderedObjectData[7][i]);
    }
    for (let i = 0; i < orderedObjectData[8].length; i++) {
        newObjectData.push(orderedObjectData[8][i]);
        newObjectData.push(orderedObjectData[9][i]);
    }
    for (let i = 10; i < 29; i++) {
        newObjectData = newObjectData.concat(orderedObjectData[i]);
    }
    objectData = newObjectData;
}

function genMetaData() {
    let metaData = [];
    let levelNameHexArray = a2h(levelNameInput.value);
    for (let i = 0; i < h2d("b8"); i++) {
        if (i == 0) {
            metaData.push("06");
        } else if ((8 <= i && i <= 11) || (20 <= i && i <= 23)) {
            metaData.push("ff");
        } else if (i == 12) {
            metaData.push(gameModeSelect.value);
        } else if (i == 16) {
            metaData.push("25");
        } else {
            metaData.push("00");
        }
    }
    for (let i = 0; i < levelNameHexArray.length; i++) {
        metaData[h2d("26") + i] = levelNameHexArray[i];
    }
    return metaData;
}

// note: game files don't seem to count locked and trap door switches
function genObjectCounts() {
    let objectCounts = [];
    for (let i = 0; i < 80; i++) {
        objectCounts.push("00");
    }
    for (let i = 0; i < 29; i++) {
        let objectId = d2h(i);
        let objectCount = 0;
        if (!(objectId == "07" || objectId == "09")) {
            for (let j = 0; j < objectData.length; j++) {
                if (objectData[j][0] == objectId) {
                    objectCount++;
                }
            }
        }
        objectCount = formatHex(d2h(objectCount), 2, true);
        objectCounts[i * 2] = objectCount[0];
        objectCounts[(i * 2) + 1] = objectCount[1];
    }
    return objectCounts;
}

function genNewHexArray(preview) {
    orderObjectData();
    let metaData = genMetaData();
    let tileData = tileArrayToHexArray(tileArray);
    let objectCounts = genObjectCounts();
    let newObjectData = [];
    for (let i = 0; i < objectData.length; i++) {
        newObjectData = newObjectData.concat(objectData[i]);
    }
    let newHexArray = metaData.concat(tileData).concat(objectCounts).concat(newObjectData);
    let fileSize = formatHex(d2h(newHexArray.length), 2, true);
    newHexArray[h2d("04")] = fileSize[0];
    newHexArray[h2d("05")] = fileSize[1];
    if (preview) {
        printArrayFormatted("meta data (" + metaData.length + "):", metaData);
        printArrayFormatted("tile data (" + tileData.length + "):", tileData);
        printArrayFormatted("object counts (" + objectCounts.length + "):", objectCounts);
        printArrayFormatted("object data (" + newObjectData.length + "):", newObjectData);
        printArrayFormatted("file size (" + fileSize.length + "):", fileSize);
        printArrayFormatted("output hex array (" + newHexArray.length + "):", newHexArray);
    }
    return newHexArray;
}

createNew();