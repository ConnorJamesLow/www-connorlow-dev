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

export const fontFamilies = {
    robotoFlex: '"Roboto Flex Local", "Roboto Flex", system-ui, -apple-system, sans-serif'
} as const;

export type FontFamily = (typeof fontFamilies)[keyof typeof fontFamilies];
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
    hero01: {
        fontFamily: fontFamilies.robotoFlex,
        weights: { light: 120 },
        styles: {
            xs: {
                fontSize: 56,
                lineHeight: 56,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontVariationSettings: '"opsz" 96, "wdth" 128, "GRAD" -180',
            },
            sm: {
                fontSize: 64,
                lineHeight: 64,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontVariationSettings: '"opsz" 128, "wdth" 128, "GRAD" -200',
            },
            lg: {
                fontSize: 128,
                lineHeight: 128,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontVariationSettings: '"opsz" 128, "wdth" 128, "GRAD" -200',
            },
            xl: {
                fontSize: 160,
                lineHeight: 160,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontVariationSettings: '"opsz" 160, "wdth" 128, "GRAD" -200',
            },
        },
    },
    hero02: {
        fontFamily: fontFamilies.robotoFlex,
        weights: { light: 190 },
        styles: {
            xs: {
                fontSize: 28,
                lineHeight: 32,
                textTransform: 'lowercase',
                letterSpacing: 0.8,
                fontVariationSettings: '"opsz" 48, "wdth" 110',
            },
            md: {
                fontSize: 48,
                lineHeight: 56,
                textTransform: 'lowercase',
                letterSpacing: 1.2,
                fontVariationSettings: '"opsz" 48, "wdth" 128',
            }
        },
    },
    headline01: {
        fontFamily: fontFamilies.robotoFlex,
        weights: { normal: 460 },
        styles: {
            xs: {
                fontSize: 30,
                lineHeight: 32,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
            },
            sm: {
                fontSize: 46,
                lineHeight: 48,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
            },
            md: {
                fontSize: 60,
                lineHeight: 64,
                textTransform: 'uppercase',
                letterSpacing: 1.38,
            }
        },
    },
    body01: {
        fontFamily: fontFamilies.robotoFlex,
        weights: { normal: 480, bold: 620 },
        styles: {
            xs: {
                fontSize: 16,
                lineHeight: 24,
            },
            md: {
                fontSize: 16,
                lineHeight: 24,
            },
            lg: {
                fontSize: 18,
                lineHeight: 24,
            }
        },
    }
} satisfies Record<string, {
    fontFamily: FontFamily;
    weights: Partial<Record<TypographyWeight, number>>,
    styles: Partial<Record<Breakpoint, TypographyStyle>>;
}>;
