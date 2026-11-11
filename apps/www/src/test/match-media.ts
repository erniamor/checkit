import { vi } from "vitest";

/** jsdom has no matchMedia: simulates the system's light or dark appearance. */
export function mockSystemAppearance(dark: boolean): void {
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: dark && query === "(prefers-color-scheme: dark)",
			media: query,
		})),
	);
}
