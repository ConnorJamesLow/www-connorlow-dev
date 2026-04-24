export function bumpUpToNearest(value: number, nearest: number) {
    return value + nearest - (value % nearest) ;
}
