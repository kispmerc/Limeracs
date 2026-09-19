/**
 * Centralized error handling for Limeracs.
 * guard/guardAsync prevent Minecraft API exceptions from breaking the framework.
 * assert is for programmer errors and throws a LimeracsError.
 */

class LimeracsError extends Error {
    constructor(message, code = 'LIMERACS_ERROR', options = {}) {
        super(message, options);
        this.name = 'LimeracsError';
        this.code = code;
    }
}

function guard(fn, onError) {
    try {
        const result = fn();
        if (result && typeof result.then === 'function') {
            return result.catch((error) => {
                onError?.(error);
                return undefined;
            });
        }
        return result;
    } catch (error) {
        onError?.(error);
        return undefined;
    }
}

async function guardAsync(fn, onError) {
    try {
        return await fn();
    } catch (error) {
        onError?.(error);
        return undefined;
    }
}

function assert(condition, message, code) {
    if (!condition) throw new LimeracsError(message, code ?? 'ASSERTION_FAILED');
}

export { LimeracsError, guard, guardAsync, assert };
