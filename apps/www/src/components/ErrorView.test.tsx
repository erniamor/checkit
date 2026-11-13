import { NetworkError } from "@repo/resources";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorView } from "@/components/ErrorView";
import { renderWithRouter } from "@/test/render-with-router";

describe("ErrorView", () => {
	it("says the app can't be reached when the API is down", async () => {
		renderWithRouter(
			<ErrorView
				error={new NetworkError(new TypeError("fetch failed"))}
				reset={vi.fn()}
			/>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Checkit can't be reached. Check your connection and try again.",
		);
	});

	it("never shows another error's details", async () => {
		renderWithRouter(
			<ErrorView
				error={new Error("relation lists does not exist")}
				reset={vi.fn()}
			/>,
		);

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Something went wrong");
		expect(alert).not.toHaveTextContent("relation");
	});
});
