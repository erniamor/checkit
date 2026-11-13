import type { Item } from "@repo/schemas";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

interface Addition {
	created: Item[];
	restored: Item[];
	skipped: string[];
}

/** One sentence per outcome of adding several items: added, back, already there. */
export function additionSummary({
	created,
	restored,
	skipped,
}: Addition): string {
	const list = new Intl.ListFormat(getLocale(), { type: "conjunction" });
	const labels = (values: string[]) => list.format(values);
	return [
		created.length > 0 &&
			m.voice_items_added({
				labels: labels(created.map((item) => item.label)),
			}),
		restored.length > 0 &&
			m.voice_items_restored({
				labels: labels(restored.map((item) => item.label)),
			}),
		skipped.length > 0 && m.voice_items_skipped({ labels: labels(skipped) }),
	]
		.filter(Boolean)
		.join(" ");
}
