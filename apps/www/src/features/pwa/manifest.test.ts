import { describe, expect, it } from "vitest";
import { webManifest } from "@/features/pwa/manifest";

describe("webManifest", () => {
	it("opens the lists as a standalone app, in the requested language", () => {
		const manifest = webManifest("fr");

		expect(manifest).toMatchObject({
			name: "Checkit",
			lang: "fr",
			description: "Des listes courtes, partagées en temps réel.",
			start_url: "/lists",
			display: "standalone",
		});
		expect(manifest.shortcuts).toEqual([
			{ name: "Mes listes", url: "/lists" },
			{ name: "Tous mes éléments", url: "/items" },
		]);
	});

	it("offers the icons installation needs, including a maskable one", () => {
		const { icons } = webManifest("en");

		expect(icons.map((icon) => icon.sizes)).toEqual([
			"192x192",
			"512x512",
			"512x512",
		]);
		expect(
			icons.some((icon) => "purpose" in icon && icon.purpose === "maskable"),
		).toBe(true);
	});
});
