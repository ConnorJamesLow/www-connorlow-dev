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
        const bit = (y * this.gridWidth + x) % 64;
        this.grid[index] |= (1 << bit);
    }

    private step(): void {
        const framesPerRow: i32 = this.gridWidth / 64;
        const rows = this.grid.length / framesPerRow;
        for (let i: i32 = 0; i < this.grid.length; i++) {
            const frame = this.grid[i];
            const row = i / framesPerRow;
            const col = i % framesPerRow;
            let b0: u64 = 0;
            let b1: u64 = 0;
            let b2: u64 = 0;

            // Get north and south
            let northFrame: u64 = row < 1 ? 0x0 : this.grid[i - framesPerRow];
            let southFrame: u64 = rows > row + 1 ? this.grid[i + framesPerRow] : 0x0;

            // Get neighbors
            let west: u64 = frame << 0x1;
            let east: u64 = frame >> 0x1;
            let north: u64 = northFrame;
            let south: u64 = southFrame;
            let northWest: u64 = (northFrame << 0x1);
            let northEast: u64 = (northFrame >> 0x1);
            let southWest: u64 = (southFrame << 0x1);
            let southEast: u64 = (southFrame >> 0x1);

            // Find the neighbor sum
            Game.addLayerToBits(north, b0, b1, b2);
            Game.addLayerToBits(northEast, b0, b1, b2);
            Game.addLayerToBits(east, b0, b1, b2);
            Game.addLayerToBits(southEast, b0, b1, b2);
            Game.addLayerToBits(south, b0, b1, b2);
            Game.addLayerToBits(southWest, b0, b1, b2);
            Game.addLayerToBits(west, b0, b1, b2);
            Game.addLayerToBits(northWest, b0, b1, b2);

            // Wherever there are two or three cells (b1 & ~b2, representing 2 or 3, since b0 is omitted) 
            //    touching an existing cell (frame), keep alive
            // Wherever there are exactly three cells (b0 & b1 & ~b2, representing 3) touching, spawn a new one.
            this.nextGrid[i] = (frame & (b1 & ~b2)) | (b1 & b0 & ~b2);
            if (frame !== 0) {
                console.log(`next grid ${i}: ${frame.toString(2).padStart(64, '0')}`);
            }
        }
        console.log('next grid');
        let temp = this.grid;
        this.grid = this.nextGrid;
        this.nextGrid = temp;
    }

    private static addLayerToBits(layer: u64, addBit0: u64, addBit1: u64, addBit2: u64): void {
        // Carry when 2 bits are 1
        let carry0 = addBit0 & layer;

        // XOR add the layer, so zeros and 1s make 0, but one of each makes 1.
        addBit0 ^= layer;
        // By now, if this layer is 1, either addBit0 or carry0 will be 1 (for a total of 1 or 2).
        // If this layer is 0, addBit0 will be unchanged.

        // Add the second (2 valued) bit to the carry. 
        // If both are set, we need to carry the one to the third (4 valued) bit slot
        let carry1 = addBit1 & carry0;

        // XOR add the carry0 to the second position bit. 
        addBit1 ^= carry0;

        // Finally, the third position bit is 1 if either addBit2 or carry1 are 1.
        addBit2 |= carry1;
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
