import { describe, expect, it } from "vitest";
import {
	splitSpokenItems,
	spokenLabels,
	spokenTask,
} from "@/features/voice/split-spoken-items";

describe("splitSpokenItems", () => {
	it("splits a French sentence and drops the articles", () => {
		expect(
			splitSpokenItems("du lait, des œufs et du pain puis de l'huile", "fr"),
		).toEqual(["Lait", "Œufs", "Pain", "Huile"]);
	});

	it("splits an English sentence", () => {
		expect(
			splitSpokenItems("some milk and eggs then a baguette", "en"),
		).toEqual(["Milk", "Eggs", "Baguette"]);
	});

	it("splits a Spanish sentence", () => {
		expect(splitSpokenItems("leche, unos huevos y pan e hielo", "es")).toEqual([
			"Leche",
			"Huevos",
			"Pan",
			"Hielo",
		]);
	});

	it("only splits on whole words", () => {
		expect(splitSpokenItems("poulet et pommes de terre", "fr")).toEqual([
			"Poulet",
			"Pommes de terre",
		]);
		expect(splitSpokenItems("sandwiches", "en")).toEqual(["Sandwiches"]);
	});

	it("keeps a repeated item once, and no empty item", () => {
		expect(splitSpokenItems("milk, and milk,, MILK and", "en")).toEqual([
			"Milk",
		]);
		expect(splitSpokenItems(" ", "en")).toEqual([]);
	});

	it("keeps an item made of an article alone", () => {
		expect(splitSpokenItems("la", "fr")).toEqual(["La"]);
	});
});

describe("spokenTask", () => {
	it("keeps the sentence as one task, articles and connectors included", () => {
		expect(
			spokenTask("  réparer la  porte du garage et tondre la pelouse. ", "fr"),
		).toEqual(["Réparer la porte du garage et tondre la pelouse"]);
	});

	it("gives nothing for silence", () => {
		expect(spokenTask(" . ", "en")).toEqual([]);
	});
});

describe("spokenLabels", () => {
	it("splits purchases, but not a task", () => {
		expect(spokenLabels("milk and eggs", "purchases", "en")).toEqual([
			"Milk",
			"Eggs",
		]);
		expect(spokenLabels("milk and eggs", "tasks", "en")).toEqual([
			"Milk and eggs",
		]);
	});
});
