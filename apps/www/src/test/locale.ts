import { afterEach } from "vitest";
import {
	baseLocale,
	type Locale,
	overwriteGetLocale,
} from "@/paraglide/runtime";

/** Renders the messages in `locale` until the end of the test. */
export function setTestLocale(locale: Locale): void {
	overwriteGetLocale(() => locale);
}

afterEach(() => {
	overwriteGetLocale(() => baseLocale);
});
