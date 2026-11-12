import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";
import type { Item } from "@repo/schemas";
import { m } from "@/paraglide/messages";

export function itemScreenReaderInstructions(): ScreenReaderInstructions {
	return { draggable: m.dnd_instructions() };
}

/** What screen readers announce while an item is moved, in the user's language. */
export function itemAnnouncements(items: readonly Item[]): Announcements {
	const total = String(items.length);
	const labelOf = (id: string | number) =>
		items.find((item) => item.id === id)?.label ?? "";
	const positionOf = (id: string | number) =>
		String(items.findIndex((item) => item.id === id) + 1);

	return {
		onDragStart: ({ active }) =>
			m.dnd_picked_up({
				label: labelOf(active.id),
				position: positionOf(active.id),
				total,
			}),
		onDragOver: ({ active, over }) =>
			over
				? m.dnd_moved({
						label: labelOf(active.id),
						position: positionOf(over.id),
						total,
					})
				: undefined,
		onDragEnd: ({ active, over }) =>
			over
				? m.dnd_dropped({
						label: labelOf(active.id),
						position: positionOf(over.id),
						total,
					})
				: m.dnd_cancelled({
						label: labelOf(active.id),
						position: positionOf(active.id),
					}),
		onDragCancel: ({ active }) =>
			m.dnd_cancelled({
				label: labelOf(active.id),
				position: positionOf(active.id),
			}),
	};
}
