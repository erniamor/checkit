import type {
	Item,
	Paginated,
	UpdateAllItems,
	UpdateItem,
} from "@repo/schemas";
import { and, asc, count, eq, max, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { items, lists } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";
import { listEvents } from "@/realtime/list-events";

type ItemRow = typeof items.$inferSelect;

function toItem(row: ItemRow): Item {
	return {
		id: row.id,
		listId: row.listId,
		label: row.label,
		done: row.done,
		doneAt: row.doneAt?.toISOString() ?? null,
		doneById: row.doneById,
		position: row.position,
		createdById: row.createdById,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function itemNotFound() {
	return new AppError(404, "item_not_found", "Item not found");
}

function inList(listId: string, itemId: string) {
	return and(eq(items.id, itemId), eq(items.listId, listId));
}

/** Items of the list, in display order. */
export async function listItems(
	listId: string,
	query: PaginationQuery,
): Promise<Paginated<Item>> {
	const [rows, [totalRow]] = await Promise.all([
		db
			.select()
			.from(items)
			.where(eq(items.listId, listId))
			.orderBy(asc(items.position), asc(items.createdAt), asc(items.id))
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db.select({ total: count() }).from(items).where(eq(items.listId, listId)),
	]);

	return {
		data: rows.map(toItem),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

/** Appends items at the end of the list, in the given order. */
export async function addItems(
	listId: string,
	userId: string,
	labels: string[],
): Promise<Item[]> {
	const created = await db.transaction(async (tx) => {
		// Locks the list row: concurrent additions to the same list wait for
		// each other, so they don't get the same positions
		await tx
			.select({ id: lists.id })
			.from(lists)
			.where(eq(lists.id, listId))
			.for("update");
		const [last] = await tx
			.select({ position: max(items.position) })
			.from(items)
			.where(eq(items.listId, listId));
		const start = (last?.position ?? 0) + 1;

		const rows = await tx
			.insert(items)
			.values(
				labels.map((label, index) => ({
					listId,
					label,
					position: start + index,
					createdById: userId,
				})),
			)
			.returning();
		return rows.map(toItem).sort((a, b) => a.position - b.position);
	});
	listEvents.publish({
		type: "items.created",
		listId,
		actorId: userId,
		items: created,
	});
	return created;
}

export async function updateItem(
	listId: string,
	itemId: string,
	userId: string,
	changes: UpdateItem,
): Promise<Item> {
	const [current] = await db.select().from(items).where(inList(listId, itemId));
	if (!current) {
		throw itemNotFound();
	}

	// Only a real change of state records who checked the item, and when
	const doneChanged =
		changes.done !== undefined && changes.done !== current.done;
	const values = {
		label: changes.label,
		position: changes.position,
		...(doneChanged && {
			done: changes.done,
			doneAt: changes.done ? new Date() : null,
			doneById: changes.done ? userId : null,
		}),
	};
	// Nothing to write, e.g. when checking an item that is already checked
	if (Object.values(values).every((value) => value === undefined)) {
		return toItem(current);
	}

	const [row] = await db
		.update(items)
		.set(values)
		.where(inList(listId, itemId))
		.returning();
	if (!row) {
		throw itemNotFound();
	}
	const item = toItem(row);
	listEvents.publish({ type: "item.updated", listId, actorId: userId, item });
	return item;
}

/**
 * Checks or unchecks every item of the list. Only the items whose state
 * changes are written and returned, in list order: the others keep who
 * checked them, and when.
 */
export async function updateAllItems(
	listId: string,
	userId: string,
	{ done }: UpdateAllItems,
): Promise<Item[]> {
	const rows = await db
		.update(items)
		.set({
			done,
			doneAt: done ? new Date() : null,
			doneById: done ? userId : null,
		})
		.where(and(eq(items.listId, listId), ne(items.done, done)))
		.returning();
	const updated = rows.map(toItem).sort((a, b) => a.position - b.position);
	if (updated.length > 0) {
		listEvents.publish({
			type: "items.updated",
			listId,
			actorId: userId,
			items: updated,
		});
	}
	return updated;
}

export async function deleteItem(
	listId: string,
	itemId: string,
	userId: string,
): Promise<void> {
	const deleted = await db
		.delete(items)
		.where(inList(listId, itemId))
		.returning({ id: items.id });
	if (deleted.length === 0) {
		throw itemNotFound();
	}
	listEvents.publish({ type: "item.deleted", listId, actorId: userId, itemId });
}
