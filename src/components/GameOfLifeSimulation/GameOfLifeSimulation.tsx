import "./_game-of-life-simulation.scss";
import * as game from "../../../wasm/as/build/release.js";
import * as patterns from "./patterns";
import { runAtFrameRate } from "../../utils/animation.js";

const { memory } = game;

export class GameOfLifeSimulation extends HTMLElement {
    private canvas?: HTMLCanvasElement;
    private gameId?: ReturnType<typeof game.createGame>;
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

        // Initialize the game
        this.gameId = game.createGame(width, height, scale);
        console.log('game initialized with id', this.gameId);

        // Draw some test shapes
        console.log('total cells:', this.cells);
        console.log('u64 array size:', this.cells / 64);
        console.log('potential memory usage (MB):', (this.cells / 64) * 8 / (1024 ** 2));
        this.runSimulation();
    }

    private runSimulation() {
        const { gameId, canvas } = this;
        if (typeof gameId !== "number" || !canvas) {
            return;
        }

        // Set up the video buffer to read from the WASM memory
        const bufferPtr = game.getImageBufferPointer(gameId);
        const ctx = canvas.getContext("2d");
        const videoView = new Uint8ClampedArray(
            memory.buffer,
            bufferPtr,
            game.getCellCount(gameId) * 4
        );
        const imageData = new ImageData(videoView, canvas.width, canvas.height);

        // Add some initial live cells for testing
        for (const [x, y] of [
            ...patterns.getLocalizedPattern('methuselahs', 'acorn', 100, 100),
            ...patterns.getLocalizedPattern('oscillators', 'beacon', 115, 150),
            ...patterns.getLocalizedPattern('spaceships', 'glider', 250, 250),
            ...patterns.getLocalizedPattern('stills', 'block', 400, 400)
        ]) {
            game.addCell(gameId, x, y);
        }


        // Start the animation loop
        runAtFrameRate(() => {
            game.nextFrame(gameId);
            ctx?.putImageData(imageData, 0, 0);
        }, 30);
    }
}

// Define the custom element
customElements.define("cmp-cgol-sim", GameOfLifeSimulation);
