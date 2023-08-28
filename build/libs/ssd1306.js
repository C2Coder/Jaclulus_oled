import * as font from "./font.js";
// commands sent when initialising the display
let extVcc = false; // if true, don't start charge pump
let initCmds = new Uint8Array([
    0xae,
    0xd5,
    0x80,
    0xa8,
    63,
    0xd3,
    0x0,
    0x40,
    0x8d,
    extVcc ? 0x10 : 0x14,
    0x20,
    0x0,
    0xa1,
    0xc8,
    0xda,
    0x12,
    0x81,
    extVcc ? 0x9f : 0xcf,
    0xd9,
    extVcc ? 0x22 : 0xf1,
    0xdb,
    0x40,
    0xa4,
    0xa6,
    0xaf, // 24 disp on
]);
// commands sent when sending data to the display
let flipCmds = [
    0x21,
    0,
    127,
    0x22,
    0,
    7 /* (height>>3)-1 */,
];
export function connect(_i2c, _addr) {
    return new SSD1306(_i2c, _addr);
}
function SSD1306(_i2c, _addr) {
    this.i2c = _i2c;
    this.addr = _addr;
    this.initialize();
}
export const test_image = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
/**
 * Initalizuje display
 * ! není potřeba volat, už je ve funkci connect !
 */
SSD1306.prototype.initialize = function () {
    for (let i = 0; i < initCmds.length; i++) {
        this.i2c.writeTo(this.addr, [0, initCmds[i]]);
    }
    // create buffer
    this.buffer = new Array(8);
    for (let i = 0; i < 8; i++) {
        let column = new Array(128).fill(0);
        this.buffer[i] = column;
    }
};
/**
 * Vykresllí pixely z bufferu na display
 */
SSD1306.prototype.flip = function () {
    // set how the data is to be sent (whole screen)
    for (let i = 0; i < initCmds.length; i++) {
        this.i2c.writeTo(this.addr, [0, flipCmds[i]]);
    }
    let chunk = new Array(128 + 1);
    chunk[0] = 0x40;
    for (let i = 0; i < 8; i++) {
        for (let p = 0; p < 128; p++) {
            chunk[p + 1] = this.buffer[i][p];
        }
        this.i2c.writeTo(this.addr, chunk);
    }
};
/**
 * Nastaví constrast
 * @param contrast {number} 0-255
 */
SSD1306.prototype.setConstrast = function (contrast) {
    this.i2c.writeTo(this.addr, 0, 0x81, contrast);
};
/**
 * Vypne display
 */
SSD1306.prototype.off = function () {
    this.i2c.writeTo(this.addr, 0, 0xae);
};
/**
 * Zapne display
 */
SSD1306.prototype.on = function () {
    this.i2c.writeTo(this.addr, 0, 0xaf);
};
/**
 * Vykreslí do bufferu pixel
 * @param x {number} x pixelu
 * @param y {number} y pixelu
 * @param bit {number} 1/0 (on/off)
 */
SSD1306.prototype.set_pixel = function (x, y, bit) {
    if (x < 128 && y < 64) {
        let row = Math.floor(y / 8);
        let list = this.buffer[row][x].toString(2).padStart(8, "0").split("");
        list[7 - (y % 8)] = bit.toString();
        this.buffer[row][x] = parseInt(list.join(""), 2);
    }
};
/**
 * Vykreslí array pixelů do bufferu
 * @param bitmap {number[][]} 2d array pixelů
 * @param x_offset {number} posunout pixelů doleva
 * @param y_offset {number} posunout pixelů dolů
 */
SSD1306.prototype.draw_array = function (bitmap, x_offset, y_offset) {
    for (let y = 0; y < bitmap.length; y++) {
        for (let x = 0; x < bitmap[0].length; x++) {
            this.set_pixel(x + x_offset, y + y_offset, bitmap[y][x]);
        }
    }
};
/**
 * Vykreslí string do bufferu
 * @param str {string} co vypsat na display
 * @param x_offset {number} posunout pixelů doleva
 * @param y_offset {number} posunout pixelů dolů
 */
SSD1306.prototype.draw_string = async function (str, x_offset, y_offset) {
    let symbols = str.split("");
    let offset = 0;
    for (let symbol = 0; symbol < symbols.length; symbol++) {
        let array = font.get_symbol(symbols[symbol]);
        for (let x = 0; x < array.length; x++) {
            let bits = array[x].toString(2).padStart(8, "0").split("");
            for (let y = 0; y < 8; y++) {
                this.set_pixel(x + x_offset + offset, y + y_offset, parseInt(bits[y], 2));
            }
        }
        offset += array.length + font.spacing;
    }
};
