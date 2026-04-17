import "./_game-of-life-simulation.scss";
import GameWrapper from "./game-wrapper.js";
import * as patterns from "./patterns";
import { runAtFrameRate } from "../../utils/animation.js";

export class GameOfLifeSimulation extends HTMLElement {
    private canvas?: HTMLCanvasElement;
    private offscreenCanvas?: OffscreenCanvas;
    private game: GameWrapper;
    private hasInitializedSimulation = false;
    private hasStartedAnimationLoop = false;
    private startAnimationLoop?: () => void;
    private framesPerSecond: number = process.env.NODE_ENV === 'development' ? 3 : 60;
    private readonly startAnimationLoopWhenReady = () => {
        if (this.hasStartedAnimationLoop || !this.isConnected) {
            return;
        }

        this.hasStartedAnimationLoop = true;
        this.startAnimationLoop?.();
    };

    get height() {
        return parseInt(this.getAttribute("height") || "5120");
    }
    get width() {
        return parseInt(this.getAttribute("width") || "5120");
    }
    get scale() {
        return parseInt(this.getAttribute("scale") || "2");
    }

    get cells() {
        const { width, height, scale } = this;
        return (width / scale) * (height / scale);
    }

    set frameRate(rate: number) {
        this.framesPerSecond = rate;
    }

    get frameRate() {
        return this.framesPerSecond;
    }

    constructor() {
        super();
        this.game = new GameWrapper(this.width, this.height, this.scale, 0xFFFFFFFF);
    }

    connectedCallback() {
        const { width, height, scale } = this;
        const gridW = width / scale;
        const gridH = height / scale;
        this.style.setProperty('--scale', scale.toString());

        if (!this.canvas) {
            // Append texsaur DOM nodes; CSS scale preserves the low-res bitmap effect.
            this.canvas = <canvas
                id="conway-canvas"
                width={gridW}
                height={gridH} /> as HTMLCanvasElement;
            this.offscreenCanvas = this.canvas.transferControlToOffscreen();
        }

        if (!this.contains(this.canvas)) {
            this.appendChild(this.canvas);
        }

        this.runSimulation();
    }

    disconnectedCallback() {
        window.removeEventListener("load", this.startAnimationLoopWhenReady);
    }

    private runSimulation() {
        const { game, canvas, scale } = this;
        if (!canvas || this.hasInitializedSimulation) {
            return;
        }

        this.hasInitializedSimulation = true;

        // Set up the video buffer to read from the WASM memory
        const bufferPtr = game.getImageBufferPointer();
        const ctx = canvas.getContext("2d");
        const videoView = new Uint8ClampedArray(
            game.buffer,
            bufferPtr,
            game.getCellCount() * 4
        );
        const imageData = new ImageData(videoView, canvas.width, canvas.height);

        // And random starting patterns
        const categories = [
            'methuselahs', 'spaceships', 'oscillators', 'stills'
        ] satisfies Parameters<typeof patterns.getRandomPattern>[2];
        const boundsX = [0, window.innerWidth / scale] as [number, number];
        const boundsY = [0, window.innerHeight / scale] as [number, number];
        const spaceFactor = Math.sqrt((window.innerWidth / 100) * (window.innerHeight / 100)) | 0;
        for (const [x, y] of Array(spaceFactor).fill(0).flatMap(() => 
            patterns.getRandomPattern(boundsX, boundsY, categories),
        )) {
            game.addCell(x, y);
        }

        // On click, add a random pattern
        document.addEventListener('click', ({ clientX, clientY }: MouseEvent) => {
            const pattern = patterns.getRandomPattern(
                [clientX / scale, clientX / scale],
                [clientY / scale, clientY / scale],
                ['crackles', 'methuselahs', 'spaceships']
            );
            game.addCells(pattern.map(([x, y]) => [x, y]));
        });

        ctx?.putImageData(imageData, 0, 0);

        this.startAnimationLoop = () => runAtFrameRate(() => {
            game.nextFrame();
            ctx?.putImageData(imageData, 0, 0);
        }, this.framesPerSecond);

        if (document.readyState === "loading") {
            window.addEventListener(
                "load",
                this.startAnimationLoopWhenReady,
                { once: true },
            );
            return;
        }

        this.startAnimationLoopWhenReady();
    }
}

// Define the custom element
window.requestIdleCallback(() => {
    customElements.define("cmp-cgol-sim", GameOfLifeSimulation);
});
