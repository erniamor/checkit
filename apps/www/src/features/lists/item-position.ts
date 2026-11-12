import type { Item } from "@repo/schemas";

/** A position between two neighbors; either can be missing, at the ends. */
export function positionBetween(before?: number, after?: number): number {
	if (before === undefined && after === undefined) {
		return 1;
	}
	if (before === undefined) {
		return (after ?? 0) - 1;
	}
	if (after === undefined) {
		return before + 1;
	}
	return (before + after) / 2;
}

/**
 * The new position of `activeId` once moved to where `overId` is, among
 * `items` in display order; undefined when it doesn't move.
 */
export function movedPosition(
	items: readonly Item[],
	activeId: string,
	overId: string,
): number | undefined {
	const from = items.findIndex((item) => item.id === activeId);
	const to = items.findIndex((item) => item.id === overId);
	if (from === -1 || to === -1 || from === to) {
		return undefined;
	}
	const others = items.filter((item) => item.id !== activeId);
	// Moving down, the item lands after the one it's dropped on; up, before it
	return positionBetween(others[to - 1]?.position, others[to]?.position);
}
