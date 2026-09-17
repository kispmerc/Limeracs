function unique(list) {
    return Array.from(new Set(list));
}

function chunk(list, size) {
    if (size <= 0) return [list];
    const result = [];
    for (let i = 0; i < list.length; i += size) {
        result.push(list.slice(i, i + size));
    }
    return result;
}

function random(list) {
    if (list.length === 0) return undefined;
    return list[Math.floor(Math.random() * list.length)];
}

function remove(list, value) {
    const index = list.indexOf(value);
    if (index === -1) return list.slice();
    const copy = list.slice();
    copy.splice(index, 1);
    return copy;
}

function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export const arrayUtils = { unique, chunk, random, remove, shuffle };
