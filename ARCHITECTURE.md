# Architecture

## Tech Stack

- Astro
- React
- TypeScript
- Tailwind CSS
- WebAssembly (Rust)

## Features

### Conway's Game of Life
As a background effect, a simulation of Conway's Game of Life will be running on the homepage. I will first implement it in AssemblyScript with plans to migrate it to Rust. It will be rendered using the HTML5 Canvas API, likely with `OffscreenCanvas`.

#### Implementation notes
- I will track a 2560x2560 grid of cells, each cell at 2x2 pixels. This will cover a 5120x5120 area.
- I will need `u64[1024000]` to store the grid state. (`2560 * 2560 = 6553600` cells, `6553600 / 64 = 102400` bigints).

#### Simple AssemblyScript single-grid, single-generation implementation
```typescript
export let generation0: u64 = 0b00000000_00000011_00000011_00000000_00010000_00100000_00111000_00000000; 

// Note: this does not account for wrapping bits for east/right and west/left transforms.
// Additionally, in a larger world, we would need information about neighboring grids
export let left = generation0 << 0x1;
export let right = generation0 >> 0x1;
export let north = generation0 << 0x8;
export let south = generation0 >> 0x8;
export let northWest = generation0 << 0x7;
export let northEast = generation0 << 0x9;
export let southWest = generation0 >> 0x7;
export let southEast = generation0 >> 0x9;

// 3 bits together represent the 8 possible states.
// Storing them in 3 separate u64s allows for parallel processing of all 64 cells.
let bit2: u64 = 0;
let bit1: u64 = 0; 
let bit0: u64 = 0;


function add(layer: u64): void {
  // Carry when 2 bits are 1
  let carry0 = bit0 & layer;

  // XOR add the layer, so zeros and 1s make 0, but one of each makes 1.
  bit0 ^= layer;
  // By now, if this layer is 1, either bit0 or carry0 will be 1 (for a total of 1 or 2).
  // If this layer is 0, bit0 will be unchanged.

  // Add the second (2 valued) bit to the carry. 
  // If both are set, we need to carry the one to the third (4 valued) bit slot
  let carry1 = bit1 & carry0;

  // XOR add the carry0 to the second position bit. 
  bit1 ^= carry0;

  // Finally, the third position bit is 1 if either bit2 or carry1 are 1.
  bit2 |= carry1;
}

function calculate(grid: u64, n: u64, ne: u64, e: u64, se: u64, s: u64, sw: u64, w: u64, nw: u64): u64 {
  // Check all neighbors
  add(n); add(ne); add(e); add(se); add(s); add(sw); add(w); add(nw);

  // Wherever there are two or three cells (bit1 & ~bit2, representing 2 or 3, since bit0 is omitted) 
  //    touching an existing cell (grid), keep alive
  // Wherever there are exactly three cells (bit0 & bit1 & ~bit2, representing 3) touching, spawn a new one.
  return (grid & (bit1 & ~bit2)) | bit1 & bit0 & ~bit2;
} 

export let generation1 = calculate(generation0, north, northEast, right, southEast, south, southWest, left, northWest);
```

#### Logic Example

```
        N
   ____ ____ ____
 0|0000|1000|0011|
  |0001|0000|0011|
 2|1001|1100|0000|
W |0000|0000|0000| E
 4|0000|0000|0000|
  |0000|0000|0000|
 6|0000|0000|0000|
   ---- ---- ----
   0 2  4 6  8 a
        S
```

```ts
let grid: Uint4Array = [
    0b0000, 0b1000, 0b0011, 
    0b0001, 0b0000, 0b0011, 
    0b1001, 0b1100, 0b0000,
    /* ...etc... */
];

let framesPerRow = 3;
let i = 7;
let northWestFrame = grid[i - framesPerRow - 1]; // 0b0001
let northFrame = grid[i - framesPerRow]; // 0b0000
let northEastFrame = grid[i - framesPerRow + 1]; // 0b0011
let westFrame = grid[i - 1]; // 0b1001
let frame = grid[i]; // 0b1100
let eastFrame = grid[i + 1]; // 0b0000;
let southWestFrame = grid[i + framesPerRow - 1]; // 0b0000;
let southFrame = grid[i + framesPerRow]; // 0b0000;
let southEastFrame = grid[i + framesPerRow + 1]; // 0b0000;
```