/** Math utilities such as clamp, lerp, and degree/radian conversion */

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function inverseLerp(a, b, value) {
    if (a === b) return 0;
    return (value - a) / (b - a);
}

function map(value, inMin, inMax, outMin, outMax) {
    return lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
}

function round(value, decimals = 0) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function floor(value) {
    return Math.floor(value);
}

function ceil(value) {
    return Math.ceil(value);
}

function abs(value) {
    return Math.abs(value);
}

function min(...values) {
    return Math.min(...values);
}

function max(...values) {
    return Math.max(...values);
}

function sign(value) {
    return Math.sign(value);
}

function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

function radToDeg(radians) {
    return (radians * 180) / Math.PI;
}

export const mathUtils = { clamp, lerp, inverseLerp, map, round, floor, ceil, abs, min, max, sign, degToRad, radToDeg };
