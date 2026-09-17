const LogLevel = Object.freeze({
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
});

const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

class LoggerState {
    constructor() {
        this.level = LogLevel.INFO;
        this.sink = (line) => console.log(line);
    }
}

const state = new LoggerState();

function format(namespace, levelIndex, args) {
    const prefix = namespace ? `[SUNDOWN][${LEVEL_NAMES[levelIndex]}][${namespace}]` : `[SUNDOWN][${LEVEL_NAMES[levelIndex]}]`;
    const message = args.map((a) => (typeof a === 'string' ? a : safeStringify(a))).join(' ');
    return `${prefix} ${message}`;
}

function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function emit(levelIndex, namespace, args) {
    if (levelIndex < state.level) return;
    const line = format(namespace, levelIndex, args);
    try {
        state.sink(line);
    } catch {
    }
}

function create(namespace) {
    return {
        debug: (...args) => emit(LogLevel.DEBUG, namespace, args),
        info: (...args) => emit(LogLevel.INFO, namespace, args),
        warn: (...args) => emit(LogLevel.WARN, namespace, args),
        error: (...args) => emit(LogLevel.ERROR, namespace, args)
    };
}

const rootLogger = create(undefined);

const log = {
    debug: rootLogger.debug,
    info: rootLogger.info,
    warn: rootLogger.warn,
    error: rootLogger.error,
    create,
    setLevel(level) {
        if (typeof level === 'string') {
            const resolved = LogLevel[level.toUpperCase()];
            if (resolved === undefined) return false;
            state.level = resolved;
            return true;
        }
        if (typeof level === 'number' && level >= 0 && level <= 4) {
            state.level = level;
            return true;
        }
        return false;
    },
    getLevel() {
        return state.level;
    },
    setSink(fn) {
        if (typeof fn === 'function') state.sink = fn;
    }
};

export { LogLevel, log };
