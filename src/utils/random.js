function int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function float(min, max) {
    return Math.random() * (max - min) + min;
}

function choice(list) {
    if (!Array.isArray(list) || list.length === 0) return undefined;
    return list[int(0, list.length - 1)];
}

function chance(probability) {
    return Math.random() < probability;
}

function weighted(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return undefined;
    const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 0), 0);
    if (total <= 0) return undefined;
    let roll = Math.random() * total;
    for (const entry of entries) {
        roll -= Math.max(0, entry.weight ?? 0);
        if (roll <= 0) return entry.value;
    }
    return entries[entries.length - 1].value;
}

export const randomUtils = { int, float, choice, chance, weighted };
