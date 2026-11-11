import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/features/home/HomePage";
import { setTestLocale } from "@/test/locale";

describe("HomePage", () => {
	it.each([
		["en", "Your to-do lists, shared"],
		["fr", "Vos listes de tâches, partagées"],
		["es", "Tus listas de tareas, compartidas"],
	] as const)("is translated in %s", (locale, title) => {
		setTestLocale(locale);

		render(<HomePage />);

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
	});
});
