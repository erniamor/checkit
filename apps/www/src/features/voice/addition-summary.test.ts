import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { additionSummary } from "@/features/voice/addition-summary";
import { setTestLocale } from "@/test/locale";

const item = (label: string) => ({ label }) as Item;

describe("additionSummary", () => {
	it("says what was added, unchecked and skipped", () => {
		expect(
			additionSummary({
				created: [item("Milk"), item("Eggs"), item("Bread")],
				restored: [item("Butter")],
				skipped: ["Jam"],
			}),
		).toBe(
			"Added: Milk, Eggs, and Bread. Back in the list: Butter. Already in the list: Jam.",
		);
	});

	it("only says what happened, in the app's language", () => {
		setTestLocale("fr");

		expect(
			additionSummary({
				created: [item("Lait"), item("Œufs")],
				restored: [],
				skipped: [],
			}),
		).toBe("Ajouté à la liste : Lait et Œufs.");
	});
});
