export class Game {
    /**
     * The width of our world in pixels.
     */
    private width: u32;
    /**
     * The height of our world in pixels.
     */
    private height: u32;
    /**
     * The scale of our world, i.e. how many pixels per cell. 
     * A scale of 1 means each cell is 1x1 pixel, a scale of 2 means each cell is 2x2 pixels, etc.
     */
    private scale: u8;
    /**
     * The grid representing the state of our world. 
     * Each bit represents a cell, where 0 is dead and 1 is alive. 
     * 
     * We use a Uint64Array to store the grid efficiently, with 64 cells per u64.
     */
    private grid!: Uint64Array;
    /**
     * A buffer for storing RGBA pixel data to be rendered to the canvas.
     * 
     */
    private rgbaBuffer!: Uint32Array;
    /**
     * The color of the live cells.
     */
    private _color: u32;

    public get imageBufferPointer(): usize {
        const rgbaBuffer = this.rgbaBuffer;
        return changetype<usize>(rgbaBuffer);
    }

    public get gridWidth(): u32 {
        return this.width / this.scale;
    }

    public get gridHeight(): u32 {
        return this.height / this.scale;
    }

    public get gridScale(): u8 {
        return this.scale;
    }

    public get color(): u32 {
        return this._color;
    }

    public set color(color: u32) {
        this._color = color;
    }

    public constructor(width: u32 = 5120, height: u32 = 5120, scale: u8 = 2, color: u32 = 0xFFFFFFFF) {
        this.width = width;
        this.height = height;
        this.scale = scale;

        // Calculate the total number of cells based on the width, height, and scale. 
        // We can use this to allocate our grid and RGBA buffer.
        const cells = (this.width / this.scale) * (this.height / this.scale);
        this.grid = new Uint64Array(<i32>Math.ceil(cells / 64));
        this.rgbaBuffer = new Uint32Array(cells);
        this._color = color;
    }

    public nextFrame(): void {
        // Implementation for updating the game
        this.visualize();
    }

    public addCell(x: u32, y: u32): void {
        const index = (y * this.gridWidth + x) / 64;
        const bit = (y * this.gridWidth + x) % 64;
        this.grid[index] |= (1 << bit);
    }

    private step(): void {
        for (let i: number = 0; i < this.grid.length; i++) {
            const frame = this.grid[i];


        }
    }

    /**
     * Visualizes the current state of the grid into the RGBA buffer.
     */
    private visualize(): void {
        const cells = this.gridWidth * this.gridHeight;
        for (let i: u32 = 0; i < cells; i++) {
            const wordIndex = i / 64;
            const bit = i % 64;
            const alive = (this.grid[wordIndex] & ((<u64>1) << bit)) != 0;
            this.rgbaBuffer[i] = alive ? this.color : 0x00000000;
        }
    }
}
