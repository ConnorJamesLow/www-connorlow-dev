type LogMethod = (...args: unknown[]) => void;

export type Logger = {
    log: LogMethod;
    info: LogMethod;
    debug: LogMethod;
    warn: LogMethod;
    error: LogMethod;
};

export const DEBUG_LOGGER_LS_KEY = "www-connorlow-dev:debug-logger";

let loggerEnabledOverride: boolean | null = null;

export function setLoggerEnabledOverride(enabled: boolean | null): void {
    loggerEnabledOverride = enabled;
}

export function isClientDebugLoggingEnabled(): boolean {
    if (import.meta.env.DEV) {
        return true;
    }

    if (typeof localStorage === "undefined") {
        return false;
    }

    try {
        return localStorage.getItem(DEBUG_LOGGER_LS_KEY) === "1";
    } catch {
        return false;
    }
}

function isLoggerEnabled(): boolean {
    if (loggerEnabledOverride !== null) {
        return loggerEnabledOverride;
    }

    return isClientDebugLoggingEnabled();
}

function createLogMethod(method: keyof Console): LogMethod {
    return (...args: unknown[]) => {
        if (!isLoggerEnabled()) {
            return;
        }

        const consoleMethod = console[method] as LogMethod;
        consoleMethod(...args);
    };
}

const logger: Logger = {
    log: createLogMethod("log"),
    info: createLogMethod("info"),
    debug: createLogMethod("debug"),
    warn: createLogMethod("warn"),
    error: createLogMethod("error"),
};

export default logger;
