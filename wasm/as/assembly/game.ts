import { Debug } from "./debug";

const MASK_RIGHTMOST: u64 = 0x0000_0000_0000_0001;
const MASK_LEFTMOST: u64 = 0x0000_0000_0000_0001 << 63;

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
    private nextGrid!: Uint64Array;
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
        return rgbaBuffer.dataStart;
    }

    /**
     * The width of the grid in cells.
     */
    public get gridWidth(): u32 {
        return this.width / this.scale;
    }

    /**
     * The height of the grid in cells.
     */
    public get gridHeight(): u32 {
        return this.height / this.scale;
    }

    /**
     * The scale of the grid, i.e. the square root of how many pixels per cell.
     */
    public get gridScale(): u8 {
        return this.scale;
    }

    /**
     * The color of the live cells.
     */
    public get color(): u32 {
        return this._color;
    }

    public set color(color: u32) {
        this._color = color;
    }

    public constructor(requestedWidth: u32 = 5120, requestedHeight: u32 = 5120, scale: u8 = 2, color: u32 = 0xFFFFFFFF) {
        this.width = requestedWidth + requestedWidth % 64;
        this.height = requestedHeight + requestedHeight % 64;
        this.scale = scale;

        // Calculate the total number of cells based on the width, height, and scale. 
        // We can use this to allocate our grid and RGBA buffer.
        const cells = (this.width / this.scale) * (this.height / this.scale);
        this.grid = new Uint64Array(<i32>Math.ceil(cells / 64));
        this.nextGrid = new Uint64Array(<i32>Math.ceil(cells / 64));
        this.rgbaBuffer = new Uint32Array(cells);
        this._color = color;
    }

    public nextFrame(): void {
        // Implementation for updating the game
        this.step();
        this.visualize();
    }

    public addCell(x: u32, y: u32): void {
        const index = (y * this.gridWidth + x) / 64;
        const bit = 63 - ((y * this.gridWidth + x) % 64);
        this.grid[index] |= (1 << bit);
    }

    private step(): void {
        const framesPerRow: i32 = this.gridWidth / 64;
        const rows = this.grid.length / framesPerRow;
        const adder = new BitAdder();

        // Hold the surrounding frames. Notes:
        // - Initial West and North frames won't exist, since this is the top of our grid.
        // - Initial East frames can only exist if there is more than one framesPerRow.
        // - Initial South frames can only exist if rows > 1.
        let frame: u64 = 0;
        let northFrame: u64 = 0;
        let northEastFrame: u64 = 0;
        let eastFrame: u64 = 0;
        let southEastFrame: u64 = 0;
        let southFrame: u64 = 0;
        let southWestFrame: u64 = 0;
        let westFrame: u64 = 0;
        let northWestFrame: u64 = 0;

        for (let i: i32 = 0; i < this.grid.length; i++) {
            const row = i / framesPerRow;

            // Get frames, north to south, west to east.
            // We can reuse some of the frames from the previous iteration, 
            // (NW <- N <- NE, W <- current frame <- E, SW <- S <- SE)
            // but we need to be careful when we hit the end of a row.
            const isFinalRow = rows <= row + 1;
            const isEndOfRow = i % framesPerRow == framesPerRow - 1;

            // Whenever we start a new row,
            if (i % framesPerRow == 0) {
                // West
                northWestFrame = 0;
                westFrame = 0;
                southWestFrame = 0;

                // Central
                northFrame = row < 1 ? 0x0 : this.grid[i - framesPerRow];
                frame = this.grid[i];
                southFrame = !isFinalRow ? this.grid[i + framesPerRow] : 0x0;
            } else {
                // West
                northWestFrame = northFrame;
                westFrame = frame;
                southWestFrame = southFrame;

                // Central
                northFrame = northEastFrame;
                frame = this.grid[i];
                southFrame = southEastFrame;
            }

            // East (is last because we actually have to find it)
            northEastFrame = row < 1 || isEndOfRow ? 0x0 : this.grid[i - framesPerRow + 1];
            eastFrame = isEndOfRow ? 0x0 : this.grid[i + 1];
            southEastFrame = isEndOfRow || isFinalRow ? 0x0 : this.grid[i + framesPerRow + 1];

            // We now need to handle wrapping bits for east/right and west/left transforms.
            // We need to find the previous and next frames in the same row and north/south rows.
            // For west, we need the rightmost bit of the previous frame
            // For east, we need the leftmost bit of the next frame
            const overflowFromEast: u64 = (MASK_LEFTMOST & eastFrame) >> 63;
            const overflowFromWest: u64 = (MASK_RIGHTMOST & westFrame) << 63;
            const overflowFromNorthEast: u64 = (MASK_LEFTMOST & northEastFrame) >> 63;
            const overflowFromNorthWest: u64 = (MASK_RIGHTMOST & northWestFrame) << 63;
            const overflowFromSouthEast: u64 = (MASK_LEFTMOST & southEastFrame) >> 63;
            const overflowFromSouthWest: u64 = (MASK_RIGHTMOST & southWestFrame) << 63;

            // Get neighbors
            const west: u64 = (frame >> 0x1) + overflowFromWest;
            const east: u64 = (frame << 0x1) + overflowFromEast;
            const north: u64 = northFrame;
            const south: u64 = southFrame;
            const northWest: u64 = (northFrame >> 0x1) + overflowFromNorthWest;
            const northEast: u64 = (northFrame << 0x1) + overflowFromNorthEast;
            const southWest: u64 = (southFrame >> 0x1) + overflowFromSouthWest;
            const southEast: u64 = (southFrame << 0x1) + overflowFromSouthEast;

            // Find the neighbor sum
            adder.reset();
            adder.addLayerToBits(north);
            adder.addLayerToBits(northEast);
            adder.addLayerToBits(east);
            adder.addLayerToBits(southEast);
            adder.addLayerToBits(south);
            adder.addLayerToBits(southWest);
            adder.addLayerToBits(west);
            adder.addLayerToBits(northWest);

            // Wherever there are two or three cells (b1 & ~b2, representing 2 or 3, since b0 is omitted) 
            //    touching an existing cell (frame), keep alive
            // Wherever there are exactly three cells (b0 & b1 & ~b2, representing 3) touching, spawn a new one.
            this.nextGrid[i] = (frame & (adder.bit1 & ~adder.bit2)) | (adder.bit1 & adder.bit0 & ~adder.bit2);
        }
        const temp = this.grid;
        this.grid = this.nextGrid;
        this.nextGrid = temp;
    }


    /**
     * Visualizes the current state of the grid into the RGBA buffer.
     */
    private visualize(): void {
        const cells = this.gridWidth * this.gridHeight;
        for (let i: u32 = 0; i < cells; i++) {
            const wordIndex = i / 64;

            // I need to reverse the bit order for the visualization.
            const bit = 63 - (i % 64);
            const alive = (this.grid[wordIndex] & ((<u64>1) << bit)) != 0;
            this.rgbaBuffer[i] = alive 
                ? this.color 
                : Debug.isDebug && (bit === 0 || i / this.gridWidth % 64 === 0) ? 0x88FF88FF : 0x00000000;

            if (!alive && Debug.isDebug) {
                // if (bit === 0 && wordIndex % (this.gridWidth / 64) === (this.gridWidth / 64) - 1) {
                //     this.rgbaBuffer[i] = 0xFF00FFFF;
                // }

                // if (wordIndex < 1) {
                //     this.rgbaBuffer[i] = 0xFFFFFF88;
                // }
            }
        }

        if (Debug.isDebug) {
            this.rgbaBuffer[0] = 0xFFFF00FF;
        }
    }
}

class BitAdder {
    private _bit0: u64;
    private _bit1: u64;
    private _bit2: u64;

    get bit0(): u64 {
        return this._bit0;
    }
    get bit1(): u64 {
        return this._bit1;
    }
    get bit2(): u64 {
        return this._bit2;
    }

    constructor() {
        this._bit0 = 0;
        this._bit1 = 0;
        this._bit2 = 0;
    }

    public addLayerToBits(layer: u64): void {
        // Carry when 2 bits are 1
        const carry0 = this._bit0 & layer;

        // XOR add the layer, so zeros and 1s make 0, but one of each makes 1.
        this._bit0 ^= layer;
        // By now, if this layer is 1, either addBit0 or carry0 will be 1 (for a total of 1 or 2).
        // If this layer is 0, addBit0 will be unchanged.

        // Add the second (2 valued) bit to the carry. 
        // If both are set, we need to carry the one to the third (4 valued) bit slot
        const carry1 = this._bit1 & carry0;

        // XOR add the carry0 to the second position bit. 
        this._bit1 ^= carry0;

        // Finally, the third position bit is 1 if either addBit2 or carry1 are 1.
        this._bit2 |= carry1;
    }

    public reset(): void {
        this._bit0 = 0;
        this._bit1 = 0;
        this._bit2 = 0;
    }
}
