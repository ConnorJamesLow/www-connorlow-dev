/// <reference lib="webworker" />
import GameWrapper from "./game-wrapper.js";
import * as patterns from "./patterns";

type InitMessage = {
    type: "init";
    canvas: OffscreenCanvas;
    width: number;
    height: number;
    scale: number;
    color: number;
    fps: number;
    viewportW: number;
    viewportH: number;
};

type AddCellsMessage = {
    type: "addCells";
    cells: [number, number][];
};

export type WorkerMessage = InitMessage | AddCellsMessage;

let game: GameWrapper | null = null;
let rafId = 0;

function startLoop(
    ctx: OffscreenCanvasRenderingContext2D,
    fps: number,
    imageData: ImageData,
) {
    const interval = 1000 / fps;
    let lastTime = performance.now();

    const frame = (currentTime: number) => {
        if (!game) {
            return;
        }
        if (currentTime - lastTime >= interval) {
            game.nextFrame();
            ctx.putImageData(imageData, 0, 0);
            lastTime = currentTime;
        }
        rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
}

export function handleGameOfLifeWorkerMessage(
    event: MessageEvent<WorkerMessage>,
): void {
    const { data } = event;

    if (data.type === "addCells") {
        game?.addCells(data.cells);
        return;
    }

    if (data.type !== "init") {
        return;
    }

    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    const {
        canvas,
        width,
        height,
        scale,
        color,
        fps,
        viewportW,
        viewportH,
    } = data;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    game = new GameWrapper(width, height, scale, color);

    const bufferPtr = game.getImageBufferPointer();
    const videoView = new Uint8ClampedArray(
        game.buffer,
        bufferPtr,
        game.getCellCount() * 4,
    );
    const imageData = new ImageData(videoView, canvas.width, canvas.height);

    const categories = [
        "methuselahs",
        "spaceships",
        "oscillators",
        "stills",
    ] satisfies Parameters<typeof patterns.getRandomPattern>[2];
    const boundsX = [0, viewportW / scale] as [number, number];
    const boundsY = [0, viewportH / scale] as [number, number];
    const spaceFactor =
        Math.sqrt((viewportW / 100) * (viewportH / 100)) | 0;
    for (const [x, y] of Array(spaceFactor)
        .fill(0)
        .flatMap(() => patterns.getRandomPattern(boundsX, boundsY, categories))) {
        game.addCell(x, y);
    }

    ctx.putImageData(imageData, 0, 0);
    startLoop(ctx, fps, imageData);
}
