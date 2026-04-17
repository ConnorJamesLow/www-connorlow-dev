export async function runAtFrameRate(callback: () => void, targetFPS: number) {
    const interval = 1000 / targetFPS;
    let lastTime = 0;

    const frame = async (currentTime: number) => {
        if (currentTime - lastTime >= interval) {
            callback();
            lastTime = currentTime;
        }
        await new Promise(resolve => window.requestIdleCallback(resolve));
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}
