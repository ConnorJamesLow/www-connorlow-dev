import "./_game-of-life-simulation.scss";
import * as patterns from "./patterns";
import { lazy } from "../../utils/lazy";
import { bumpUpToNearest } from "../../utils/math";

type AddCellsMessage = {
    type: "addCells";
    cells: [number, number][];
};

export class GameOfLifeSimulation extends HTMLElement {
    private canvas?: HTMLCanvasElement;
    private worker?: Worker;
    private hasInitializedSimulation = false;
    private hasStartedAnimationLoop = false;
    private framesPerSecond: number =
        process.env.NODE_ENV === "development" ? 6 : 12;
    private readonly height = lazy(() => this.calculateHeight());
    private readonly width = lazy(() => this.calculateWidth());

    private readonly startAnimationLoopWhenReady = () => {
        if (this.hasStartedAnimationLoop || !this.isConnected) {
            return;
        }

        this.hasStartedAnimationLoop = true;

        const offscreen = this.canvas?.transferControlToOffscreen();
        if (!offscreen || !this.worker) {
            return;
        }

        const { width: { value: width }, height: { value: height }, scale } = this;
        this.worker.postMessage(
            {
                type: "init",
                canvas: offscreen,
                width,
                height,
                scale,
                color: 0xffffffff,
                fps: this.framesPerSecond,
                viewportW: window.innerWidth,
                viewportH: window.innerHeight,
            },
            [offscreen],
        );

        document.addEventListener("click", this.onDocumentClick);
    };

    private readonly onDocumentClick = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const { scale } = this;
        const cx = clientX / scale;
        const cy = clientY / scale;
        const pattern = patterns.getRandomPattern(
            [cx + 56, cx + 72],
            [cy + 56, cy + 72],
            ["crackles", "methuselahs", "spaceships"],
        );
        const message: AddCellsMessage = {
            type: "addCells",
            cells: pattern.map(([x, y]) => [x, y]),
        };
        this.worker?.postMessage(message);
    };

    private calculateHeight() {
        const { scale } = this;
        const requestedHeight = parseInt(this.getAttribute("height") || "5120");
        const maxHeight = bumpUpToNearest(
            screen.height + (scale * screen.height * 2 + 128), 64 * scale,
        );
        console.log('maxHeight', maxHeight, 'requestedHeight', requestedHeight);
        return Math.min(maxHeight, requestedHeight);
    }

    private calculateWidth() {
        const { scale } = this;
        const requestedWidth = parseInt(this.getAttribute("width") || "5120");
        const maxWidth = bumpUpToNearest(
            (screen.width + (scale * screen.width * 2 + 128)), 64 * scale,
        );
        console.log('maxWidth', maxWidth, 'requestedWidth', requestedWidth);
        return Math.min(maxWidth, requestedWidth);
    }

    get scale() {
        return parseInt(this.getAttribute("scale") || "2");
    }

    get cells() {
        const { width: { value: width }, height: { value: height }, scale } = this;
        return (width / scale) * (height / scale);
    }

    set frameRate(rate: number) {
        this.framesPerSecond = rate;
    }

    get frameRate() {
        return this.framesPerSecond;
    }

    connectedCallback() {
        const { width: { value: width }, height: { value: height }, scale } = this;
        console.log('width', width, 'height', height, 'scale', scale);
        const gridW = width / scale;
        const gridH = height / scale;
        this.style.setProperty("--scale", scale.toString());

        if (!this.canvas) {
            this.canvas = (
                <canvas id="conway-canvas" width={gridW} height={gridH} />
            ) as HTMLCanvasElement;
        }

        if (!this.contains(this.canvas)) {
            this.appendChild(this.canvas);
        }

        this.runSimulation();
    }

    disconnectedCallback() {
        window.removeEventListener("load", this.startAnimationLoopWhenReady);
        document.removeEventListener("click", this.onDocumentClick);
        this.worker?.terminate();
        this.worker = undefined;
        this.hasInitializedSimulation = false;
        this.hasStartedAnimationLoop = false;
        if (this.canvas?.isConnected) {
            this.canvas.remove();
        }
        this.canvas = undefined;
    }

    private runSimulation() {
        const { canvas } = this;
        if (!canvas || this.hasInitializedSimulation) {
            return;
        }

        this.hasInitializedSimulation = true;

        this.worker = new Worker(
            new URL("./game-of-life.worker.ts", import.meta.url),
            { type: "module" },
        );

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

window.requestIdleCallback(() => {
    customElements.define("cmp-cgol-sim", GameOfLifeSimulation);
});
