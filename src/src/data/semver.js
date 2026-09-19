/**
 * Small semver implementation for module-system dependencies
 * Supports basic comparisons and ranges: =, >, >=, <, <=, ^, ~
 */


function parse(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(version).trim());
    if (!match) return null;
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        pre: match[4] ?? null
    };
}

function compare(a, b) {
    const pa = parse(a);
    const pb = parse(b);
    if (!pa || !pb) return null;
    if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
    if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
    if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
    if (pa.pre === pb.pre) return 0;
    if (pa.pre === null) return 1;
    if (pb.pre === null) return -1;
    return pa.pre > pb.pre ? 1 : pa.pre < pb.pre ? -1 : 0;
}

function satisfies(version, range) {
    const trimmed = String(range).trim();
    const rangeMatch = /^(>=|<=|>|<|=|\^|~)?\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(trimmed);
    if (!rangeMatch) return false;
    const operator = rangeMatch[1] ?? '=';
    const target = rangeMatch[2];
    const cmp = compare(version, target);
    if (cmp === null) return false;
    switch (operator) {
        case '>=': return cmp >= 0;
        case '<=': return cmp <= 0;
        case '>': return cmp > 0;
        case '<': return cmp < 0;
        case '=': return cmp === 0;
        case '^': {
            const pv = parse(version);
            const pt = parse(target);
            if (!pv || !pt) return false;
            if (pv.major !== pt.major) return false;
            return cmp >= 0;
        }
        case '~': {
            const pv = parse(version);
            const pt = parse(target);
            if (!pv || !pt) return false;
            if (pv.major !== pt.major || pv.minor !== pt.minor) return false;
            return cmp >= 0;
        }
        default: return false;
    }
}

function isValid(version) {
    return parse(version) !== null;
}

export const semver = { parse, compare, satisfies, isValid };
