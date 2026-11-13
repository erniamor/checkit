import type { ListKind } from "@repo/schemas";
import { ListTodoIcon, type LucideIcon, ShoppingCartIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

export const listKindIcons: Record<ListKind, LucideIcon> = {
	purchases: ShoppingCartIcon,
	tasks: ListTodoIcon,
};

export const listKindLabels: Record<ListKind, () => string> = {
	purchases: m.list_kind_purchases,
	tasks: m.list_kind_tasks,
};

/** The kinds offered when creating or changing a list, in this order. */
export function listKindOptions() {
	return (["purchases", "tasks"] as const).map((value) => ({
		value,
		label: listKindLabels[value](),
	}));
}
