export function lazy<T>(factory: () => T) {
    let value: T | undefined;
    return ({
        get value() {
            if (!value) {
                value = factory();
            }
            return value;
        }
    });
}
