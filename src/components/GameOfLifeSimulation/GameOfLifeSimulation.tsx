import "./_game-of-life-simulation.scss";
import GameWrapper from "./game-wrapper.js";
import * as patterns from "./patterns";
import { runAtFrameRate } from "../../utils/animation.js";

export class GameOfLifeSimulation extends HTMLElement {
    private canvas?: HTMLCanvasElement;
    private game: GameWrapper;
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

    constructor() {
        super();
        this.game = new GameWrapper(this.width, this.height, this.scale, 0xFFFFFFFF);
    }

    connectedCallback() {
        const { width, height, scale } = this;
        const gridW = width / scale;
        const gridH = height / scale;
        this.style.setProperty('--scale', scale.toString());

        // Append texsaur generated DOM nodes (bitmap matches WASM cell grid; CSS scale upsamples)
        const canvas = <canvas
            id="conway-canvas"
            width={gridW}
            height={gridH} /> as HTMLCanvasElement;
        this.canvas = canvas;
        this.appendChild(canvas);

        // Draw some test shapes
        console.log('total cells:', this.cells);
        console.log('u64 array size:', this.cells / 64);
        console.log('potential memory usage (MB):', (this.cells / 64) * 8 / (1024 ** 2));
        this.runSimulation();
    }

    private runSimulation() {
        const { game, canvas } = this;
        if (!canvas) {
            return;
        }

        // Set up the video buffer to read from the WASM memory
        const bufferPtr = game.getImageBufferPointer();
        const ctx = canvas.getContext("2d");
        const videoView = new Uint8ClampedArray(
            game.buffer,
            bufferPtr,
            game.getCellCount() * 4
        );
        const imageData = new ImageData(videoView, canvas.width, canvas.height);

        // Add some initial live cells for testing
        for (const [x, y] of [
            ...patterns.getLocalizedPattern('methuselahs', 'acorn', 20, 25),
            ...patterns.getLocalizedPattern('oscillators', 'beacon', 100, 48),
            ...patterns.getLocalizedPattern('spaceships', 'glider', 80, 100),
            ...patterns.getLocalizedPattern('stills', 'block', 175, 25)
        ]) {
            game.addCell(x, y);
        }


        // Start the animation loop
        runAtFrameRate(() => {
            game.nextFrame();
            ctx?.putImageData(imageData, 0, 0);
        }, 1);
    }
}

// Define the custom element
customElements.define("cmp-cgol-sim", GameOfLifeSimulation);
