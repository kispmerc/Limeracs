/** Central logger with levels, namespaces, and a replaceable output sink. */

const LogLevel = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 });
const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
const PREFIX = 'LIMERACS';

const state = {
    level: LogLevel.INFO,
    sink: (line) => console.log(line)
};

function safeStringify(value) {
    try { return JSON.stringify(value); } catch { return String(value); }
}

function format(namespace, levelIndex, args) {
    const prefix = namespace
        ? `[${PREFIX}][${LEVEL_NAMES[levelIndex]}][${namespace}]`
        : `[${PREFIX}][${LEVEL_NAMES[levelIndex]}]`;
    return `${prefix} ${args.map((a) => typeof a === 'string' ? a : safeStringify(a)).join(' ')}`;
}

function emit(levelIndex, namespace, args) {
    if (levelIndex < state.level) return;
    try { state.sink(format(namespace, levelIndex, args)); } catch { /* logging must never break the runtime */ }
}

function create(namespace) {
    return {
        debug: (...args) => emit(LogLevel.DEBUG, namespace, args),
        info: (...args) => emit(LogLevel.INFO, namespace, args),
        warn: (...args) => emit(LogLevel.WARN, namespace, args),
        error: (...args) => emit(LogLevel.ERROR, namespace, args)
    };
}

const root = create();
const log = {
    debug: root.debug,
    info: root.info,
    warn: root.warn,
    error: root.error,
    create,
    setLevel(level) {
        if (typeof level === 'string') level = LogLevel[level.toUpperCase()];
        if (!Number.isInteger(level) || level < 0 || level > LogLevel.NONE) return false;
        state.level = level;
        return true;
    },
    getLevel: () => state.level,
    setSink(fn) {
        if (typeof fn !== 'function') return false;
        state.sink = fn;
        return true;
    }
};

export { LogLevel, log };
