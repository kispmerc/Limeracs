class SundownError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'SundownError';
        this.code = code ?? 'SUNDOWN_ERROR';
    }
}

function guard(fn, onError) {
    try {
        const result = fn();
        if (result && typeof result.catch === 'function') {
            return result.catch((error) => {
                if (onError) onError(error);
                return undefined;
            });
        }
        return result;
    } catch (error) {
        if (onError) onError(error);
        return undefined;
    }
}

async function guardAsync(fn, onError) {
    try {
        return await fn();
    } catch (error) {
        if (onError) onError(error);
        return undefined;
    }
}

function assert(condition, message, code) {
    if (!condition) {
        throw new SundownError(message, code ?? 'ASSERTION_FAILED');
    }
}

export { SundownError, guard, guardAsync, assert };
