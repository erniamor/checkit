import { describe, expect, it } from "vitest";
import {
	DISMISSAL_DAYS,
	dismissInstall,
	isInstallDismissed,
} from "@/features/pwa/install-dismissal";

function memoryStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => {
			values.set(key, value);
		},
	};
}

const day = 24 * 60 * 60 * 1000;

describe("install dismissal", () => {
	it("hides the offer for a while after “Not now”, then offers it again", () => {
		const storage = memoryStorage();
		const now = Date.UTC(2026, 10, 12);
		expect(isInstallDismissed(now, storage)).toBe(false);

		dismissInstall(now, storage);

		expect(isInstallDismissed(now + day, storage)).toBe(true);
		expect(isInstallDismissed(now + DISMISSAL_DAYS * day, storage)).toBe(false);
	});

	it("offers it when the storage is blocked", () => {
		const blocked = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
		};

		expect(() => dismissInstall(Date.now(), blocked)).not.toThrow();
		expect(isInstallDismissed(Date.now(), blocked)).toBe(false);
	});
});
