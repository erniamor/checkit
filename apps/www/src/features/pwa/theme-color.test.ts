import { themeBarColors } from "@repo/themes";
import { afterEach, describe, expect, it } from "vitest";
import { applyThemeColor, themeColorMetas } from "@/features/pwa/theme-color";

const garden = themeBarColors.garden;

function contents(metas: { content: string }[]) {
	return metas.map((meta) => meta.content);
}

describe("themeColorMetas", () => {
	it("follows the system's appearance, with the theme's colors", () => {
		expect(contents(themeColorMetas("garden", "system"))).toEqual([
			garden.light,
			garden.dark,
		]);
	});

	it("uses one color whatever the system, when a mode is chosen", () => {
		expect(contents(themeColorMetas("garden", "light"))).toEqual([
			garden.light,
			garden.light,
		]);
		expect(contents(themeColorMetas("garden", "dark"))).toEqual([
			garden.dark,
			garden.dark,
		]);
	});
});

describe("applyThemeColor", () => {
	afterEach(() => {
		document.head.innerHTML = "";
	});

	it("updates the page's tags after a change of appearance", () => {
		for (const meta of themeColorMetas("stationery", "system")) {
			const tag = document.createElement("meta");
			tag.setAttribute("name", meta.name);
			tag.setAttribute("media", meta.media);
			tag.setAttribute("content", meta.content);
			document.head.append(tag);
		}

		applyThemeColor("garden", "dark");

		expect(
			[...document.querySelectorAll('meta[name="theme-color"]')].map((tag) =>
				tag.getAttribute("content"),
			),
		).toEqual([garden.dark, garden.dark]);
	});
});
