import { methuselahs } from "./methuselahs";
import { oscillators } from "./oscillators";
import { spaceships } from "./spaceships";
import { stills } from "./stills";
import { crackles } from "./crackles";
import { guns } from "./guns";

const patterns = {
    methuselahs,
    oscillators,
    spaceships,
    stills,
    crackles,
    guns
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
    category: T,
    name: keyof typeof patterns[T],
    offsetX: number,
    offsetY: number,
    rotate: [boolean, boolean] = [false, false]): [number, number][] {
    const [rotateX, rotateY] = rotate;

    const pattern = patterns[category][name] as number[][];
    const coordinates: [number, number][] = [];

    // Map the 2D pattern to a 1D array of coordinates offset by the given parameters.
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            const rx = rotateX ? pattern[y].length - 1 - x : x;
            const ry = rotateY ? pattern.length - 1 - y : y;
            if (pattern[ry][rx] === 1) {
                coordinates.push([x + offsetX, y + offsetY]);
            }
        }
    }
    return coordinates;
}

export function getRandomPattern<T extends keyof typeof patterns>(
    rangeX: [number, number],
    rangeY: [number, number],
    limitCategories: T[] = Object.keys(patterns) as T[]): [number, number][] {
    const offsetX = ((Math.random() * (rangeX[1] - rangeX[0] + 1)) + rangeX[0]) | 0;
    const offsetY = ((Math.random() * (rangeY[1] - rangeY[0] + 1)) + rangeY[0]) | 0;
    // To give each pattern equal weight, we need to combine the selected categories into a 
    // single array before selecting a random pattern.
    const combinedCategories = limitCategories.flatMap(
        c => Object.keys(patterns[c]).flatMap(name => [[c, name]])
    );
    const [
        category, 
        name
    ] = combinedCategories[Math.floor(Math.random() * combinedCategories.length)];
    console.log('create:', category, name, 'at', offsetX, offsetY);
    return getLocalizedPattern(
        category as T,
        name as keyof typeof patterns[T],
        offsetX,
        offsetY,
        [Math.random() < 0.5, Math.random() < 0.5]);
}