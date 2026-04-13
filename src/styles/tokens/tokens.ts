export const breakpoints = {
    xs: {
        min: 0,
        max: 416,
        // 8 * 25 * columns = 400px
        containerMax: 'auto',
        columns: 2,
        padding: 16
    },
    sm: {
        min: 816,
        max: 1184,
        // (8 unit) 64px columns = 768px
        containerMax: 768,
        columns: 2,
        padding: 24
    },
    md: {
        min: 1200,
        max: 1792,
        // (12 unit) 96px columns = 1152px
        containerMax: 1152,
        columns: 12,
        padding: 24
    },
    lg: {
        min: 1792,
        max: 2560,
        // (18 unit) 144px columns = 1728px
        containerMax: 1728,
        columns: 12,
        padding: 32
    },
    xl: {
        min: 2560,
        max: 3072,
        // (13 unit) 208px columns = 2496px
        containerMax: 2496,
        columns: 24,
        padding: 32
    },
    xxl: {
        min: 2560,
        max: 3072,
        // (18 unit) 288px columns = 3456px
        containerMax: 3456,
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

export type FontFamily = 'Roboto Flex' | 'Montserrat';
export type TypographyWeight = 'normal' | 'bold' | 'light';
export type TypographyStyle = Partial<{
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    paragraphSpacing: number;
    textTransform: string;
    textDecoration: string;
    textAlign: string;
    fontVariationSettings: string;
}>;

export type RobotoFlexVariationProperty = 
    "slnt" | "wdth" | "GRAD" | "XOPQ" | "XTRA" | "YOPQ" 
    | "YTAS" | "YTDE" | "YTFI" | "YTLC" | "YTUC";

export const typography = {
    headline01: {
        fontFamily: 'Montserrat',
        weights: { bold: 700 },
        styles: {
            xs: {
                fontSize: 32,
                textTransform: 'uppercase',
            },
            md: {
                fontSize: 48,
            },
            lg: {
                fontSize: 64,
            }
        },
    }
} satisfies Record<string, {
    fontFamily: FontFamily;
    weights: Partial<Record<TypographyWeight, number>>,
    styles: Partial<Record<Breakpoint, TypographyStyle>>;
}>;
