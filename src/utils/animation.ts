export function runAtFrameRate(callback: () => void, targetFPS: number) {
    const interval = 1000 / targetFPS;
    let lastTime = 0;

    const frame = (currentTime: number) => {
        if (currentTime - lastTime >= interval) {
            callback();
            lastTime = currentTime;
        }
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}
