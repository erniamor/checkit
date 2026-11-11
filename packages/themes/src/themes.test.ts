import { describe, expect, it } from "vitest";
import baseCss from "./base.css?raw";
import { defaultTheme, isThemeName, type ThemeName, themes } from "./index";
import brutalistCss from "./themes/brutalist.css?raw";
import gardenCss from "./themes/garden.css?raw";
import neutralCss from "./themes/neutral.css?raw";
import stationeryCss from "./themes/stationery.css?raw";
import synthwaveCss from "./themes/synthwave.css?raw";

const themeCss: Record<ThemeName, string> = {
	stationery: stationeryCss,
	synthwave: synthwaveCss,
	garden: gardenCss,
	brutalist: brutalistCss,
	neutral: neutralCss,
};

type Mode = "light" | "dark";
type Tokens = Map<string, string>;

/** Reads the `selector { --var: value; }` blocks of a theme file, grouped by mode. */
function parseTheme(css: string): Record<Mode, Tokens> {
	const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const modes: Partial<Record<Mode, Tokens>> = {};
	for (const [, selector = "", body = ""] of withoutComments.matchAll(
		/([^{}]+)\{([^{}]*)\}/g,
	)) {
		const mode: Mode = selector.includes(".dark") ? "dark" : "light";
		const tokens: Tokens = new Map();
		for (const [, name = "", value = ""] of body.matchAll(
			/(--[\w-]+)\s*:\s*([^;]+);/g,
		)) {
			tokens.set(name, value.trim());
		}
		modes[mode] = tokens;
	}
	if (!modes.light || !modes.dark) {
		throw new Error("A theme must define a light and a dark variant");
	}
	return { light: modes.light, dark: modes.dark };
}

function relativeLuminance(hex: string): number {
	const channels = [1, 3, 5].map((i) => {
		const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	const [r = 0, g = 0, b = 0] = channels;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
	const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
		(x, y) => y - x,
	);
	return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** Background / text pairs (4.5 threshold) and non-text indicators (3 threshold, WCAG 1.4.11). */
const contrastPairs: ReadonlyArray<[string, string, number]> = [
	["--background", "--foreground", 4.5],
	["--background", "--muted-foreground", 4.5],
	["--background", "--primary", 4.5],
	["--card", "--card-foreground", 4.5],
	["--popover", "--popover-foreground", 4.5],
	["--primary", "--primary-foreground", 4.5],
	["--secondary", "--secondary-foreground", 4.5],
	["--muted", "--muted-foreground", 4.5],
	["--accent", "--accent-foreground", 4.5],
	["--destructive", "--destructive-foreground", 4.5],
	["--inverse", "--inverse-foreground", 4.5],
	["--inverse", "--inverse-muted-foreground", 4.5],
	["--background", "--ring", 3],
];

const parsed = themes.map(
	(name) => [name, parseTheme(themeCss[name])] as const,
);
const [reference] = parsed;
if (!reference) throw new Error("No theme declared");
const referenceTokens = [...reference[1].light.keys()].sort();

describe("index", () => {
	it("lists the default theme among the themes", () => {
		expect(themes).toContain(defaultTheme);
	});

	it("applies the default theme, and only it, without a data-theme attribute", () => {
		for (const name of themes) {
			expect(themeCss[name].includes(":root:not([data-theme])"), name).toBe(
				name === defaultTheme,
			);
		}
	});

	it("only accepts known theme names", () => {
		expect(isThemeName("garden")).toBe(true);
		expect(isThemeName("unknown")).toBe(false);
		expect(isThemeName(undefined)).toBe(false);
	});
});

describe("base.css", () => {
	it("only references variables defined by the themes", () => {
		const referenced = [...baseCss.matchAll(/var\((--[\w-]+)\)/g)].map(
			([, name]) => name,
		);
		expect(referenced.length).toBeGreaterThan(0);
		for (const name of referenced) {
			expect(referenceTokens).toContain(name);
		}
	});
});

describe.each(parsed)("theme %s", (_name, modes) => {
	describe.each(["light", "dark"] as const)("mode %s", (mode) => {
		const tokens = modes[mode];

		it("defines exactly the same variables as the other themes", () => {
			expect([...tokens.keys()].sort()).toEqual(referenceTokens);
		});

		it("expresses every color in hexadecimal", () => {
			for (const [name, value] of tokens) {
				if (name.startsWith("--typeface") || name === "--radius") continue;
				expect(value, name).toMatch(/^#[0-9a-f]{6}$/);
			}
		});

		it.each(contrastPairs)("contrast %s / %s ≥ %d", (bg, fg, minimum) => {
			const ratio = contrastRatio(tokens.get(bg) ?? "", tokens.get(fg) ?? "");
			expect(ratio).toBeGreaterThanOrEqual(minimum);
		});
	});
});
