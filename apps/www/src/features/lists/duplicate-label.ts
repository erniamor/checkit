import { type Item, normalizeItemLabel } from "@repo/schemas";

/** The other item of the list with this label, case and extra spaces aside. */
export function itemWithLabel(
	items: readonly Item[],
	label: string,
	exceptId?: string,
): Item | undefined {
	const key = normalizeItemLabel(label);
	return items.find(
		(item) => item.id !== exceptId && normalizeItemLabel(item.label) === key,
	);
}

export type Addition =
	| { kind: "add" }
	/** Already among the items to do: refused. */
	| { kind: "taken"; item: Item }
	/** Checked: unchecked rather than added again. */
	| { kind: "restore"; item: Item };

/** What adding `label` does to the list; the API applies the same rule. */
export function resolveAddition(
	items: readonly Item[],
	label: string,
): Addition {
	const item = itemWithLabel(items, label);
	if (!item) {
		return { kind: "add" };
	}
	return item.done ? { kind: "restore", item } : { kind: "taken", item };
}
