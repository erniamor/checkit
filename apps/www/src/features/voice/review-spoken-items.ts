import {
	createItemsBatchSchema,
	type Item,
	itemLabelSchema,
} from "@repo/schemas";
import { resolveAddition } from "@/features/lists/duplicate-label";
import { errorMessage } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

/** What adding this label will do, when it isn't a plain addition. */
export function spokenItemHint(
	items: readonly Item[],
	label: string,
): string | undefined {
	switch (resolveAddition(items, label).kind) {
		case "taken":
			return m.voice_item_taken();
		case "restore":
			return m.voice_item_restore();
		case "add":
			return undefined;
	}
}

export type SpokenItemsCheck =
	| { ok: true; labels: string[] }
	| {
			ok: false;
			/** One per label, in order: its error, if any. */
			fields: (string | undefined)[];
			/** About the whole set: none left, or too many. */
			form?: string;
	  };

/** Validates the reviewed labels with the API's schemas, before adding them. */
export function checkSpokenItems(labels: readonly string[]): SpokenItemsCheck {
	const results = labels.map((label) => itemLabelSchema.safeParse(label));
	const fields = results.map((result) =>
		result.success
			? undefined
			: errorMessage(result.error.issues[0]?.message ?? ""),
	);
	if (fields.some((error) => error !== undefined)) {
		return { ok: false, fields };
	}
	const valid = results.flatMap((result) =>
		result.success ? [result.data] : [],
	);
	const batch = createItemsBatchSchema.safeParse({ labels: valid });
	if (!batch.success) {
		return {
			ok: false,
			fields,
			form: errorMessage(batch.error.issues[0]?.message ?? ""),
		};
	}
	return { ok: true, labels: batch.data.labels };
}
