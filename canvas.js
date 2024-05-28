
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();

import {
    getObjectsOfId
} from "./script.js";

import {
    h2d,
    objectCoordsToPixelPos
} from "./utils.js";

const tileSprites = new Image;
const tileSpritesIndices = [null, 6, 12, 14, 15, 16, 17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 21, 26, 22, 27, 24, 23, 25, 28, 31, 29, 7, 8, 9, 10, 13, 11, 30, 32];
const objectSprites = new Image;
export const tileSize = canvas.width / 42;
export const quarterTileSize = tileSize / 4;

tileSprites.src = "tiles.png";
objectSprites.src = "objects.png";

export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawGrid(mode) {
    if (mode > 0) {
        drawFeintGrid(2);
        if (mode == 2) {
            drawFeintGrid(4);
            drawFeintGrid(4 / 3);
        }
    }
    ctx.fillStyle = "#a3aa9d";
    for (let x = (tileSize) - 1; x < canvas.width - 1; x += (tileSize)) {
        ctx.fillRect(x, 0, 2, canvas.height);
    }
    for (let y = (tileSize) - 1; y < canvas.height - 1; y += (tileSize)) {
        ctx.fillRect(0, y, canvas.width, 2);
    }
}

export function drawFeintGrid(offset) {
    ctx.fillStyle = "#99a093";
    for (let x = (tileSize) / offset; x < canvas.width; x += (tileSize)) {
        ctx.fillRect(x, 0, 1, canvas.height);
    }
    for (let y = (tileSize) / offset; y < canvas.height; y += (tileSize)) {
        ctx.fillRect(0, y, canvas.width, 1);
    }
}

export function drawTiles(tileArray) {
    for (let gridY = 0; gridY < 23; gridY++) {
        for (let gridX = 0; gridX < 42; gridX++) {
            let tileId = tileArray[gridY][gridX];
            if (tileId != "00") {
                let spriteIndex = tileSpritesIndices[h2d(tileId)];
                ctx.drawImage(tileSprites, spriteIndex * 44, 0, 44, 44, gridX * tileSize, gridY * tileSize, tileSize, tileSize);
            }
        }
    }
}

export function drawObjects(objectData) {
    for (let i = 0; i < objectData.length; i++) {
        let object = objectData[i];
        let spriteY = h2d(object[0]);
        let spriteX = h2d(object[3]);
        let gridX = (h2d(object[1]) - 4) * quarterTileSize;
        let gridY = (h2d(object[2]) - 4) * quarterTileSize;
        ctx.drawImage(objectSprites, spriteX * 44, spriteY * 44, 44, 44, gridX - (tileSize / 2), gridY - (tileSize / 2), tileSize, tileSize);
    }
}

export function drawCenterLines() {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(0, canvas.height / 2, canvas.width, 2);
    ctx.fillRect(canvas.width / 2, 0, 2, canvas.height);
}

export function drawDoorSwitchLines() {
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