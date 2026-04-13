import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { breakpoints, typography } from '../src/styles/tokens/tokens.ts';

type BreakpointName = keyof typeof breakpoints;
type BreakpointToken = (typeof breakpoints)[BreakpointName];
type TypographyName = keyof typeof typography;
type TypographyToken = (typeof typography)[TypographyName];
type TypographyStyle = TypographyToken['styles'][BreakpointName];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '../src/styles/tokens/_generated.scss');
const indentUnit = '  ';

const styleProperties = [
    { tokenKey: 'fontSize', cssName: 'font-size', cssFallback: null, declaration: false },
    { tokenKey: 'lineHeight', cssName: 'line-height', cssFallback: 'normal', declaration: false },
    { tokenKey: 'letterSpacing', cssName: 'letter-spacing', cssFallback: 'normal', declaration: true },
    { tokenKey: 'paragraphSpacing', cssName: 'paragraph-spacing', cssFallback: '0px', declaration: false },
    { tokenKey: 'textTransform', cssName: 'text-transform', cssFallback: 'none', declaration: true },
    { tokenKey: 'textDecoration', cssName: 'text-decoration', cssFallback: 'none', declaration: true },
    { tokenKey: 'textAlign', cssName: 'text-align', cssFallback: 'inherit', declaration: true },
    { tokenKey: 'fontVariationSettings', cssName: 'font-variation-settings', cssFallback: 'normal', declaration: true }
] as const satisfies ReadonlyArray<{
    tokenKey: keyof NonNullable<TypographyStyle>;
    cssName: string;
    cssFallback: string | null;
    declaration: boolean;
}>;

function toKebabCase(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
}

function toPx(value: number): string {
    return `${value}px`;
}

function quote(value: string): string {
    return JSON.stringify(value);
}

function formatScssValue(value: number | string, property?: string): string {
    if (typeof value === 'number') {
        if (property === 'font-weight' || property === 'columns') {
            return `${value}`;
        }

        return toPx(value);
    }

    return value;
}

function formatStyleValue(property: (typeof styleProperties)[number]['tokenKey'], value: NonNullable<TypographyStyle>[typeof property]): string {
    if (typeof value === 'number') {
        return toPx(value);
    }

    return String(value);
}

function sortStyleEntries(token: TypographyToken): [BreakpointName, NonNullable<TypographyStyle>][] {
    return Object.entries(token.styles)
        .filter((entry): entry is [string, NonNullable<TypographyStyle>] => entry[1] != null)
        .sort(([left], [right]) => breakpointOrder(left as BreakpointName) - breakpointOrder(right as BreakpointName))
        .map(([breakpoint, style]) => [breakpoint as BreakpointName, style]);
}

function breakpointOrder(name: BreakpointName): number {
    return Object.keys(breakpoints).indexOf(name);
}

function ensureValidTokens(): void {
    const breakpointEntries = Object.entries(breakpoints) as [BreakpointName, BreakpointToken][];

    if (breakpointEntries.length === 0) {
        throw new Error('No breakpoints were defined in tokens.ts.');
    }

    for (const [name, token] of breakpointEntries) {
        if (token.min > token.max) {
            throw new Error(`Breakpoint "${name}" has a min larger than its max.`);
        }

        if (token.containerMax !== 'auto' && token.columns <= 0) {
            throw new Error(`Breakpoint "${name}" must define at least one column.`);
        }
    }

    const typographyEntries = Object.entries(typography) as [TypographyName, TypographyToken][];

    for (const [name, token] of typographyEntries) {
        const weights = Object.entries(token.weights);

        if (weights.length === 0) {
            throw new Error(`Typography token "${name}" must define at least one weight.`);
        }

        const styleEntries = sortStyleEntries(token);

        if (styleEntries.length === 0) {
            throw new Error(`Typography token "${name}" must define at least one viewport style.`);
        }

        const [firstBreakpoint, firstStyle] = styleEntries[0];

        if (firstStyle.fontSize == null) {
            throw new Error(`Typography token "${name}" must define fontSize for its first viewport style (${firstBreakpoint}).`);
        }

        for (const [breakpoint] of styleEntries) {
            if (!(breakpoint in breakpoints)) {
                throw new Error(`Typography token "${name}" references an unknown breakpoint "${breakpoint}".`);
            }
        }
    }
}

function renderBreakpointsMap(): string[] {
    const lines = ['$breakpoints: ('];

    for (const [name, token] of Object.entries(breakpoints) as [BreakpointName, BreakpointToken][]) {
        lines.push(`${indentUnit}${name}: (`);
        lines.push(`${indentUnit.repeat(2)}min: ${formatScssValue(token.min)},`);
        lines.push(`${indentUnit.repeat(2)}max: ${formatScssValue(token.max)},`);
        lines.push(`${indentUnit.repeat(2)}container-max: ${formatScssValue(token.containerMax)},`);
        lines.push(`${indentUnit.repeat(2)}columns: ${formatScssValue(token.columns, 'columns')},`);
        lines.push(`${indentUnit.repeat(2)}padding: ${formatScssValue(token.padding)},`);
        lines.push(`${indentUnit}),`);
    }

    lines.push(');');
    return lines;
}

function renderBreakpointHelpers(): string[] {
    return [
        '@function _breakpoint-token($breakpoint) {',
        `${indentUnit}@if not map.has-key($breakpoints, $breakpoint) {`,
        `${indentUnit.repeat(2)}@error "Unknown breakpoint \`#{$breakpoint}\`.";`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@return map.get($breakpoints, $breakpoint);`,
        '}',
        '',
        '@function breakpoint-value($breakpoint, $key) {',
        `${indentUnit}$token: _breakpoint-token($breakpoint);`,
        '',
        `${indentUnit}@if not map.has-key($token, $key) {`,
        `${indentUnit.repeat(2)}@error "Unknown breakpoint value \`#{$key}\` for \`#{$breakpoint}\`.";`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@return map.get($token, $key);`,
        '}',
        '',
        '@mixin media-min($breakpoint) {',
        `${indentUnit}@media (min-width: #{breakpoint-value($breakpoint, min)}) {`,
        `${indentUnit.repeat(2)}@content;`,
        `${indentUnit}}`,
        '}',
        '',
        '@mixin media-max($breakpoint) {',
        `${indentUnit}@media (max-width: #{breakpoint-value($breakpoint, max)}) {`,
        `${indentUnit.repeat(2)}@content;`,
        `${indentUnit}}`,
        '}',
        '',
        '@function container-threshold($breakpoint, $columns: max) {',
        `${indentUnit}$token: _breakpoint-token($breakpoint);`,
        `${indentUnit}$container-max: map.get($token, container-max);`,
        `${indentUnit}$total-columns: map.get($token, columns);`,
        '',
        `${indentUnit}@if $container-max == auto {`,
        `${indentUnit.repeat(2)}@error "Breakpoint \`#{$breakpoint}\` does not expose a numeric container max.";`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@if $columns == max {`,
        `${indentUnit.repeat(2)}@return $container-max;`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@if meta.type-of($columns) != number or not math.is-unitless($columns) {`,
        `${indentUnit.repeat(2)}@error "Expected $columns to be a unitless number or \`max\`, got \`#{$columns}\`.";`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@if $columns <= 0 or $columns > $total-columns {`,
        `${indentUnit.repeat(2)}@error "Requested \`#{$columns}\` columns, but breakpoint \`#{$breakpoint}\` only supports \`#{$total-columns}\`.";`,
        `${indentUnit}}`,
        '',
        `${indentUnit}@return math.div($container-max, $total-columns) * $columns;`,
        '}',
        '',
        '@mixin container-query($breakpoint, $columns: max) {',
        `${indentUnit}@container (min-width: #{container-threshold($breakpoint, $columns)}) {`,
        `${indentUnit.repeat(2)}@content;`,
        `${indentUnit}}`,
        '}'
    ];
}

function renderResponsiveVariableMixin(mixinName: string, cssVariableName: string, propertyName: keyof BreakpointToken): string[] {
    const lines = [`@mixin ${mixinName}($variable-name: --${cssVariableName}) {`];
    let previousValue: number | string | null = null;

    for (const [index, [breakpoint, token]] of (Object.entries(breakpoints) as [BreakpointName, BreakpointToken][]).entries()) {
        const rawValue = token[propertyName];

        if (rawValue === previousValue) {
            continue;
        }

        const value = formatScssValue(rawValue as number | string, propertyName === 'columns' ? 'columns' : undefined);

        if (index === 0) {
            lines.push(`${indentUnit}#{$variable-name}: ${value};`);
        } else {
            lines.push(`${indentUnit}@include media-min(${breakpoint}) {`);
            lines.push(`${indentUnit.repeat(2)}#{$variable-name}: ${value};`);
            lines.push(`${indentUnit}}`);
        }

        previousValue = rawValue as number | string;
    }

    lines.push('}');
    return lines;
}

function renderTypographyWeightMap(name: TypographyName, token: TypographyToken): string[] {
    const tokenName = toKebabCase(name);
    const defaultWeight = Object.keys(token.weights)[0];
    const lines = [`$typography-${tokenName}-weights: (`];

    for (const [weightName, value] of Object.entries(token.weights)) {
        lines.push(`${indentUnit}${weightName}: ${value},`);
    }

    lines.push(');');
    lines.push('');
    lines.push(`@function typography-${tokenName}-weight($weight: ${defaultWeight}) {`);
    lines.push(`${indentUnit}@if not map.has-key($typography-${tokenName}-weights, $weight) {`);
    lines.push(`${indentUnit.repeat(2)}@error "Unknown weight \`#{$weight}\` for typography token \`${tokenName}\`.";`);
    lines.push(`${indentUnit}}`);
    lines.push('');
    lines.push(`${indentUnit}@return map.get($typography-${tokenName}-weights, $weight);`);
    lines.push('}');

    return lines;
}

function renderTypographyMixin(name: TypographyName, token: TypographyToken): string[] {
    const tokenName = toKebabCase(name);
    const defaultWeight = Object.keys(token.weights)[0];
    const hasLineHeight = sortStyleEntries(token).some(([, style]) => style.lineHeight != null);
    const fontSizeVar = `var(--typography-${tokenName}-font-size)`;
    const fontFamilyVar = `var(--typography-${tokenName}-font-family)`;
    const lineHeightSegment = hasLineHeight
        ? `/var(--typography-${tokenName}-line-height, normal)`
        : '';

    const lines = [`@mixin typography-${tokenName}($weight: ${defaultWeight}) {`];

    lines.push(`${indentUnit}font: normal typography-${tokenName}-weight($weight) ${fontSizeVar}${lineHeightSegment} ${fontFamilyVar};`);

    for (const property of styleProperties) {
        if (!property.declaration) {
            continue;
        }

        const isUsed = sortStyleEntries(token).some(([, style]) => style[property.tokenKey] != null);

        if (!isUsed) {
            continue;
        }

        lines.push(
            `${indentUnit}${property.cssName}: var(--typography-${tokenName}-${property.cssName}, ${property.cssFallback});`
        );
    }

    lines.push('}');
    return lines;
}

function renderTypographyVariableDeclarations(name: TypographyName, token: TypographyToken): string[] {
    const tokenName = toKebabCase(name);
    const defaultWeight = Object.keys(token.weights)[0];
    const hasLineHeight = sortStyleEntries(token).some(([, style]) => style.lineHeight != null);
    const fontValue = hasLineHeight
        ? `normal var(--typography-${tokenName}-weight-${defaultWeight}) var(--typography-${tokenName}-font-size) / var(--typography-${tokenName}-line-height, normal) var(--typography-${tokenName}-font-family)`
        : `normal var(--typography-${tokenName}-weight-${defaultWeight}) var(--typography-${tokenName}-font-size) var(--typography-${tokenName}-font-family)`;

    const lines = [
        `${indentUnit}--typography-${tokenName}-font-family: ${quote(token.fontFamily)};`
    ];

    for (const [weightName, value] of Object.entries(token.weights)) {
        lines.push(`${indentUnit}--typography-${tokenName}-weight-${weightName}: ${value};`);
    }

    lines.push(`${indentUnit}--typography-${tokenName}-font: ${fontValue};`);

    const styles = sortStyleEntries(token);

    for (const [index, [breakpoint, style]] of styles.entries()) {
        const declarations = styleProperties
            .filter(({ tokenKey }) => style[tokenKey] != null)
            .map(({ tokenKey, cssName }) => {
                const value = style[tokenKey];
                return `${indentUnit.repeat(index === 0 ? 1 : 2)}--typography-${tokenName}-${cssName}: ${formatStyleValue(tokenKey, value as NonNullable<TypographyStyle>[typeof tokenKey])};`;
            });

        if (declarations.length === 0) {
            continue;
        }

        if (index === 0) {
            lines.push(...declarations);
            continue;
        }

        lines.push(`${indentUnit}@include media-min(${breakpoint}) {`);
        lines.push(...declarations);
        lines.push(`${indentUnit}}`);
    }

    return lines;
}

function buildScss(): string {
    ensureValidTokens();

    const lines: string[] = [
        '// This file is generated by scripts/generate-style-tokens.ts.',
        '// Do not edit it by hand.',
        '',
        '@use "sass:map";',
        '@use "sass:math";',
        '@use "sass:meta";',
        '',
        ...renderBreakpointsMap(),
        '',
        ...renderBreakpointHelpers(),
        '',
        ...renderResponsiveVariableMixin('container-max-vars', 'container-max', 'containerMax'),
        '',
        ...renderResponsiveVariableMixin('padding-vars', 'page-padding', 'padding'),
        '',
        '@mixin typography-vars() {'
    ];

    for (const [index, [name, token]] of (Object.entries(typography) as [TypographyName, TypographyToken][]).entries()) {
        if (index > 0) {
            lines.push('');
        }

        lines.push(...renderTypographyVariableDeclarations(name, token));
    }

    lines.push('}');

    for (const [name, token] of Object.entries(typography) as [TypographyName, TypographyToken][]) {
        lines.push('');
        lines.push(...renderTypographyWeightMap(name, token));
        lines.push('');
        lines.push(...renderTypographyMixin(name, token));
    }

    lines.push('');
    return `${lines.join('\n')}`;
}

async function main(): Promise<void> {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, buildScss(), 'utf8');
    console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
