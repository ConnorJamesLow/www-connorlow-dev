import * as game from "wasm-as";
import logger from "../../utils/logger";

const { memory } = game;

export default class GameWrapper {
    private width: number;
    private height: number;
    private scale: number;
    private color: number;
    private gameId: ReturnType<typeof game.createGame>;

    constructor(width: number, height: number, scale: number, color: number) {
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.color = color;
        this.gameId = game.createGame(width, height, scale, color);
        logger.log("game initialized with id", this.gameId);
    }

    public nextFrame(): void {
        game.nextFrame(this.gameId);
    }

    public addCell(x: number, y: number): void {
        game.addCell(this.gameId, x, y);
    }

    public addCells(cells: [number, number][]): void {
        for (const [x, y] of cells) {
            game.addCell(this.gameId, x, y);
        }
    }

    public getImageBufferPointer(): number {
        return game.getImageBufferPointer(this.gameId);
    }

    public getCellCount(): number {
        return game.getCellCount(this.gameId);
    }

    public get buffer() {
        const { buffer } = memory;
        return buffer;
    }
}
