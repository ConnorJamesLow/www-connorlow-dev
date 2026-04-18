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

class GameOfLifeWorkerController {
    private game: GameWrapper | null = null;
    private canvas: OffscreenCanvas | null = null;
    private ctx: OffscreenCanvasRenderingContext2D | null = null;
    private imageData: ImageData | null = null;
    private rafId = 0;

    public handleMessage(event: MessageEvent<WorkerMessage>): void {
        const { data } = event;

        if (data.type === "addCells") {
            this.game?.addCells(data.cells);
            return;
        }

        if (data.type !== "init") {
            return;
        }

        this.init(data);
    }

    private init(data: InitMessage): void {
        this.stop();

        this.canvas = data.canvas;
        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx) {
            this.resetState();
            return;
        }

        const {
            width,
            height,
            scale,
            color,
            fps,
            viewportW,
            viewportH,
        } = data;

        this.game = new GameWrapper(width, height, scale, color);
        this.imageData = this.createImageData();
        this.seedInitialPatterns(viewportW, viewportH, scale);
        this.render();
        this.startLoop(fps);
    }

    private createImageData(): ImageData | null {
        if (!this.game || !this.canvas) {
            return null;
        }

        const bufferPtr = this.game.getImageBufferPointer();
        const videoView = new Uint8ClampedArray(
            this.game.buffer,
            bufferPtr,
            this.game.getCellCount() * 4,
        );
        return new ImageData(videoView, this.canvas.width, this.canvas.height);
    }

    private seedInitialPatterns(
        viewportW: number,
        viewportH: number,
        scale: number,
    ): void {
        if (!this.game) {
            return;
        }

        const categories = [
            "guns",
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
            .flatMap(() =>
                patterns.getRandomPattern(boundsX, boundsY, categories),
            )) {
            this.game.addCell(x, y);
        }
    }

    private startLoop(fps: number): void {
        const interval = 1000 / fps;
        let lastTime = performance.now();

        const frame = (currentTime: number) => {
            if (!this.game) {
                return;
            }

            if (currentTime - lastTime >= interval) {
                this.game.nextFrame();
                this.render();
                lastTime = currentTime;
            }

            this.rafId = requestAnimationFrame(frame);
        };

        this.rafId = requestAnimationFrame(frame);
    }

    private render(): void {
        if (!this.ctx || !this.imageData) {
            return;
        }

        try {
            this.ctx.putImageData(this.imageData, 0, 0);
        } catch (error) {
            console.error("Error putting image data:", error);
        }
    }

    private stop(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }

        this.resetState();
    }

    private resetState(): void {
        this.game = null;
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
    }
}

const controller = new GameOfLifeWorkerController();

export function handleGameOfLifeWorkerMessage(
    event: MessageEvent<WorkerMessage>,
): void {
    controller.handleMessage(event);
}
