import "./_game-of-life-simulation.scss";
import GameWrapper from "./game-wrapper.js";
import * as patterns from "./patterns";
import { runAtFrameRate } from "../../utils/animation.js";

export class GameOfLifeSimulation extends HTMLElement {
    private canvas?: HTMLCanvasElement;
    private game: GameWrapper;
    private framesPerSecond: number = 60;

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

        // Append texsaur generated DOM nodes (bitmap matches WASM cell grid; CSS scale upsamples)
        const canvas = <canvas
            id="conway-canvas"
            width={gridW}
            height={gridH} /> as HTMLCanvasElement;
        this.canvas = canvas;
        this.appendChild(canvas);
        this.runSimulation();
    }

    private runSimulation() {
        const { game, canvas, scale } = this;
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

        const categories = [
            'methuselahs', 'spaceships', 'oscillators', 'stills'
        ] satisfies Parameters<typeof patterns.getRandomPattern>[2];
        const boundsX = [0, window.innerWidth / scale] as [number, number];
        const boundsY = [0, window.innerHeight / scale] as [number, number];
        for (const [x, y] of [
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
            ...patterns.getRandomPattern(boundsX, boundsY, categories),
        ]) {
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

        // Start the animation loop
        runAtFrameRate(() => {
            game.nextFrame();
            ctx?.putImageData(imageData, 0, 0);
        }, this.framesPerSecond);
    }
}

// Define the custom element
customElements.define("cmp-cgol-sim", GameOfLifeSimulation);
