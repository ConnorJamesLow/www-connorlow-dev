import { methuselahs } from "./methuselahs";
import { oscillators } from "./oscillators";
import { spaceships } from "./spaceships";
import { stills } from "./stills";

const patterns = {
    methuselahs,
    oscillators,
    spaceships,
    stills
};

export const flattenedPatterns = Object.entries(patterns).flatMap(([category, patterns]) =>
    Object.entries(patterns).map(([name, pattern]) => ({
        category,
        name,
        pattern
    }))
);

/**
 * Get a pattern localized to the given coordinates. 
 * 
 * @param category The category of the pattern to retrieve.
 * @param name The name of the pattern to retrieve.
 * @param offsetX The x-offset to apply to the pattern.
 * @param offsetY The y-offset to apply to the pattern.
 */
export function getLocalizedPattern<T extends keyof typeof patterns>(
    category: T, name: keyof typeof patterns[T], offsetX: number, offsetY: number): [number, number][] {
    const pattern = patterns[category][name] as number[][];
    const coordinates: [number, number][] = [];

    // Map the 2D pattern to a 1D array of coordinates offset by the given parameters.
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            if (pattern[y][x] === 1) {
                coordinates.push([x + offsetX, y + offsetY]);
            }
        }
    }
    return coordinates;
}