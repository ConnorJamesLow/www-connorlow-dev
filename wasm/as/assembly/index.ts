import { Game } from "./game";

const games = new Map<u32, Game>();

export function createGame(width: u32, height: u32, scale: u8): u32 {
    const game = new Game(width, height, scale);
    const id = games.size;
    games.set(id, game);
    return id;
}

export function nextFrame(gameId: u32): void {
    const game = games.get(gameId);
    game.nextFrame();
}   

export function getImageBufferPointer(gameId: u32): usize {
    const game = games.get(gameId);
    if (!game) {
        return 0;
    }
    return game.imageBufferPointer;
}

export function getCellCount(gameId: u32): usize {
    const game = games.get(gameId);
    if (!game) {
        return 0;
    }
    console.log(`grid width: ${game.gridWidth}`);
    console.log(`grid height: ${game.gridHeight}`);
    console.log(`grid scale: ${game.gridScale}`);
    return game.gridWidth * game.gridHeight;
}

export function addCell(gameId: u32, x: u32, y: u32): void {
    const game = games.get(gameId);
    if (!game) {
        return;
    }
    game.add(x, y);
}