/** 3D vector helpers for positions/directions in the Minecraft world */

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function multiply(a, scalar) {
    return { x: a.x * scalar, y: a.y * scalar, z: a.z * scalar };
}

function divide(a, scalar) {
    return { x: a.x / scalar, y: a.y / scalar, z: a.z / scalar };
}

function lengthSquared(a) {
    return a.x * a.x + a.y * a.y + a.z * a.z;
}

function length(a) {
    return Math.sqrt(lengthSquared(a));
}

function normalize(a) {
    const len = length(a);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return divide(a, len);
}

function distanceSquared(a, b) {
    return lengthSquared(subtract(a, b));
}

function distance(a, b) {
    return Math.sqrt(distanceSquared(a, b));
}

function direction(from, to) {
    return normalize(subtract(to, from));
}

function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

function equals(a, b, epsilon = 1e-6) {
    return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon && Math.abs(a.z - b.z) <= epsilon;
}

function clone(a) {
    return { x: a.x, y: a.y, z: a.z };
}

const zero = Object.freeze({ x: 0, y: 0, z: 0 });
const up = Object.freeze({ x: 0, y: 1, z: 0 });
const down = Object.freeze({ x: 0, y: -1, z: 0 });
const forward = Object.freeze({ x: 0, y: 0, z: 1 });

export const vector = {
    add,
    subtract,
    multiply,
    divide,
    length,
    lengthSquared,
    normalize,
    distance,
    distanceSquared,
    direction,
    lerp,
    equals,
    clone,
    zero,
    up,
    down,
    forward
};
