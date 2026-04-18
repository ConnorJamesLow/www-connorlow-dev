import {
    typographyTokens,
    type FontVariationAxisMap,
    type ResponsiveTypographyVariantToken
} from '../../fonts/generated/tokens.ts';

export const fontFamilies = {
    robotoFlex: '"Roboto Flex", system-ui, -apple-system, sans-serif',
    firaCode: '"Fira Code", "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
} as const;

export type FontFamily = string;
export type TypographyWeight = 'normal' | 'bold' | 'light';
export type TypographyStyle = Partial<{
    fontSize: number | string;
    lineHeight: number | string;
    letterSpacing: number | string;
    paragraphSpacing: number | string;
    textTransform: string;
    textDecoration: string;
    textAlign: string;
    fontVariationSettings: string;
}>;
export type TypographyBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type TypographyToken = {
    fontFamily: FontFamily;
    weights: Partial<Record<TypographyWeight, number>>;
    styles: Partial<Record<TypographyBreakpoint, TypographyStyle>>;
};

const fontFamilyMap: Record<string, FontFamily> = {
    'Roboto Flex': fontFamilies.robotoFlex,
    'Fira Code': fontFamilies.firaCode
};

function parseNumber(value: string): number | null {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMetric(value: string | null): number | string | undefined {
    if (value == null) {
        return undefined;
    }

    const trimmed = value.trim();

    if (trimmed === '') {
        return undefined;
    }

    if (trimmed.endsWith('px')) {
        const px = parseNumber(trimmed.slice(0, -2));
        return px ?? trimmed;
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        // Preserve unitless values (e.g. line-height: "1") as strings.
        return trimmed;
    }

    return trimmed;
}

function toFontVariationSettings(axes: FontVariationAxisMap): string {
    const entries = Object.entries(axes);

    if (entries.length === 0) {
        return 'normal';
    }

    return entries
        .map(([axis, value]) => `"${axis}" ${value}`)
        .join(', ');
}

function inferWeightKey(variantName: string, weight: number): TypographyWeight {
    const lowerName = variantName.toLowerCase();

    if (lowerName.includes('bold') || weight >= 600) {
        return 'bold';
    }

    if (weight <= 300) {
        return 'light';
    }

    return 'normal';
}

function normalizeStyle(variant: {
    fontSize: string;
    lineHeight: string;
    letterSpacing: string | null;
    textTransform: string;
    fontVariationSettings: FontVariationAxisMap;
}): TypographyStyle {
    return {
        fontSize: normalizeMetric(variant.fontSize),
        lineHeight: normalizeMetric(variant.lineHeight),
        letterSpacing: normalizeMetric(variant.letterSpacing),
        textTransform: variant.textTransform,
        fontVariationSettings: toFontVariationSettings(variant.fontVariationSettings)
    };
}

function resolveFontFamily(fontFamily: string | null): FontFamily {
    if (fontFamily == null) {
        return fontFamilies.robotoFlex;
    }

    return fontFamilyMap[fontFamily] ?? `"${fontFamily}", system-ui, -apple-system, sans-serif`;
}

function adaptVariant(name: string, variant: ResponsiveTypographyVariantToken): TypographyToken {
    const fontWeight = parseNumber(variant.default.fontWeight) ?? 400;
    const weightKey = inferWeightKey(name, fontWeight);
    const styles: Partial<Record<TypographyBreakpoint, TypographyStyle>> = {
        xs: normalizeStyle(variant.default)
    };

    for (const [breakpoint, breakpointVariant] of Object.entries(variant.breakpoints)) {
        styles[breakpoint as TypographyBreakpoint] = normalizeStyle(breakpointVariant);
    }

    return {
        fontFamily: resolveFontFamily(variant.default.fontFamily),
        weights: {
            [weightKey]: fontWeight
        },
        styles
    };
}

export const typography: Record<string, TypographyToken> = Object.fromEntries(
    Object.entries(typographyTokens).map(([name, variant]) => [name, adaptVariant(name, variant)])
);
