export const breakpoints = {
    xs: {
        min: 0,
        max: 720,
        // 8 * 25 * columns = 400px
        containerMax: 'auto',
        columns: 2,
        padding: 16
    },
    sm: {
        min: 720,
        max: 1008,
        // (7 unit) 56px columns = 672px
        containerMax: 720,
        columns: 2,
        padding: 24
    },
    md: {
        min: 1008,
        max: 1600,
        // (10 unit) 80px columns = 960px
        containerMax: 1008,
        columns: 12,
        padding: 24
    },
    lg: {
        min: 1600,
        max: 2560,
        // (16 unit) 128px columns = 1536px
        containerMax: 1600,
        columns: 12,
        padding: 32
    },
    xl: {
        min: 2560,
        max: 3520,
        // (13 unit) 208px columns = 2496px
        containerMax: 2560,
        columns: 24,
        padding: 32
    },
    xxl: {
        min: 3520,
        max: 9999,
        // (18 unit) 288px columns = 3456px
        containerMax: 3520,
        columns: 24,
        padding: 32
    }
} satisfies Record<string, {
    min: number;
    max: number;
    containerMax: number | 'auto';
    columns: number;
    padding: number;
}>;


export type Breakpoint = keyof typeof breakpoints;
export { fontFamilies, typography } from './typography.ts';
export type {
    FontFamily,
    TypographyBreakpoint,
    TypographyStyle,
    TypographyToken,
    TypographyWeight
} from './typography.ts';
