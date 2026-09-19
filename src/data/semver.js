/** Small, dependency-free SemVer implementation used by the module system. */

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function parse(version) {
    const match = VERSION_RE.exec(String(version).trim());
    if (!match) return null;
    const identifiers = match[4]?.split('.') ?? [];
    return { major: +match[1], minor: +match[2], patch: +match[3], pre: identifiers.length ? identifiers : null };
}

function compareIdentifiers(a, b) {
    const an = /^\d+$/.test(a), bn = /^\d+$/.test(b);
    if (an && bn) return Number(a) === Number(b) ? 0 : Number(a) > Number(b) ? 1 : -1;
    if (an) return -1;
    if (bn) return 1;
    return a === b ? 0 : a > b ? 1 : -1;
}

function compare(a, b) {
    const pa = parse(a), pb = parse(b);
    if (!pa || !pb) return null;
    for (const key of ['major', 'minor', 'patch']) {
        if (pa[key] !== pb[key]) return pa[key] > pb[key] ? 1 : -1;
    }
    if (!pa.pre && !pb.pre) return 0;
    if (!pa.pre) return 1;
    if (!pb.pre) return -1;
    const length = Math.max(pa.pre.length, pb.pre.length);
    for (let i = 0; i < length; i += 1) {
        if (pa.pre[i] === undefined) return -1;
        if (pb.pre[i] === undefined) return 1;
        const result = compareIdentifiers(pa.pre[i], pb.pre[i]);
        if (result) return result;
    }
    return 0;
}

function satisfies(version, range) {
    const trimmed = String(range).trim();
    const match = /^(>=|<=|>|<|=|\^|~)?\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(trimmed);
    if (!match) return false;
    const op = match[1] ?? '=';
    const target = parse(match[2]);
    const current = parse(version);
    if (!target || !current) return false;
    const cmp = compare(version, match[2]);
    if (cmp === null) return false;
    // SemVer prereleases do not satisfy a normal release range unless the range itself names a prerelease.
    if (current.pre && !target.pre) return false;
    if (op === '>=') return cmp >= 0;
    if (op === '<=') return cmp <= 0;
    if (op === '>') return cmp > 0;
    if (op === '<') return cmp < 0;
    if (op === '=') return cmp === 0;
    if (op === '~') return cmp >= 0 && current.major === target.major && current.minor === target.minor;
    if (op === '^') {
        if (cmp < 0) return false;
        if (target.major > 0) return current.major === target.major;
        if (target.minor > 0) return current.major === 0 && current.minor === target.minor;
        return current.major === 0 && current.minor === 0 && current.patch === target.patch;
    }
    return false;
}

function isValid(version) { return parse(version) !== null; }
export const semver = { parse, compare, satisfies, isValid };
