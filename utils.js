
import {tileSize, quarterTileSize} from "./canvas.js";

export function h2d(hex) {
    return parseInt(hex, 16);
}

export function d2h(decimal) {
    let hex = decimal.toString(16);
    if (hex.length == 1) {
        hex = "0" + hex;
    }
    return hex;
}

export function h2a(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

export function a2h(string) {
    let hexArray = [];
    for (let i = 0; i < string.length; i++) {
        hexArray.push(string.charCodeAt(i).toString(16));
    }
    return hexArray;
}

export function intArrayToHexArray(Uint8Array) {
	let hexArray = [];
	for (let i = 0; i < Uint8Array.length; i++) {
		let hex = d2h(Uint8Array[i]);
		hexArray.push(hex);
	}
	return hexArray;
}

export function toGridPos(x, y) {
    return [Math.floor(x / tileSize), Math.floor(y / tileSize)];
}

export function indexToGridPos(i) {
    let y = Math.floor(i / 42);
    let x = i - (y * 42);
    return [x, y];
}

export function objectCoordsToPixelPos(objectCoords) {
    return [(h2d(objectCoords[0]) - 4) * quarterTileSize, (h2d(objectCoords[1]) - 4) * quarterTileSize];
}

export function toObjectCoords(x, y) {
    return [Math.round(x / (tileSize / 4)) + 4, Math.round(y / (tileSize / 4)) + 4];
}

export function printArrayFormatted(s, array) {
    s += "\n";
    for (let i = 0; i < array.length; i++) {
        s += array[i] + " ";
    }
    console.log(s);
}

export function formatHex(hex, nBytes, bigEndian) {
    let newHex = "";
    let newHexArray = [];
    if (hex.length % 2 == 1) {
        newHex += "0";
    }
    newHex += hex;
    while (newHex.length / 2 < nBytes) {
        newHex = "00" + newHex;
    }
    for (let i = 0; i < newHex.length; i += 2) {
        newHexArray.push(newHex[i] + newHex[i+1]);
    }
    if (bigEndian) {
        newHexArray = newHexArray.reverse();
    }
    return newHexArray;
}