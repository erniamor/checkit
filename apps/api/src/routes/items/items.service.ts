import {
	ITEM_LABEL_TAKEN,
	type Item,
	type ItemStatus,
	type ItemWithList,
	normalizeItemLabel,
	type Paginated,
	type UpdateAllItems,
	type UpdateItem,
} from "@repo/schemas";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { db, type Transaction } from "@/db/client";
import { items, listMembers, lists } from "@/db/schema";
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

function statusCondition(status: ItemStatus) {
	switch (status) {
		case "open":
			return eq(items.done, false);
		case "checked":
			return eq(items.done, true);
		case "all":
			return undefined;
	}
}

/**
 * Items of every list the user is a member of, filtered by status. Grouped by
 * list, in the order of "My lists" (most recent first), then in display order.
 */
export async function listItemsOfUser(
	userId: string,
	{ status, ...query }: PaginationQuery & { status: ItemStatus },
): Promise<Paginated<ItemWithList>> {
	const where = and(eq(listMembers.userId, userId), statusCondition(status));
	const [rows, [totalRow]] = await Promise.all([
		db
			.select({
				item: items,
				list: {
					id: lists.id,
					name: lists.name,
					kind: lists.kind,
					role: listMembers.role,
				},
			})
			.from(items)
			.innerJoin(listMembers, eq(listMembers.listId, items.listId))
			.innerJoin(lists, eq(lists.id, items.listId))
			.where(where)
			.orderBy(
				desc(lists.createdAt),
				desc(lists.id),
				asc(items.position),
				asc(items.createdAt),
				asc(items.id),
			)
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db
			.select({ total: count() })
			.from(items)
			.innerJoin(listMembers, eq(listMembers.listId, items.listId))
			.where(where),
	]);

	return {
		data: rows.map((row) => ({ ...toItem(row.item), list: row.list })),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

function labelTaken() {
	return new AppError(
		409,
		ITEM_LABEL_TAKEN,
		"Another item of the list already has this label",
		[{ field: "label", message: ITEM_LABEL_TAKEN }],
	);
}

/**
 * Locks the list's row until the end of the transaction: concurrent changes
 * to the same list wait for each other, so they can't both take the same
 * position or the same label.
 */
async function lockList(tx: Transaction, listId: string) {
	await tx
		.select({ id: lists.id })
		.from(lists)
		.where(eq(lists.id, listId))
		.for("update");
}

export interface ItemsAddition {
	created: Item[];
	/** Checked items whose label came again: unchecked instead of duplicated. */
	restored: Item[];
	/** Labels left out: already among the items to do, or repeated. */
	skipped: string[];
}

/**
 * Appends items at the end of the list, in the given order. A label the list
 * already has (case and extra spaces aside) is never duplicated: a checked
 * item is unchecked instead, an item to do is left as is and its label
 * skipped, or refused with `whenTaken: "fail"`.
 */
export async function addItems(
	listId: string,
	userId: string,
	labels: string[],
	{ whenTaken }: { whenTaken: "fail" | "skip" },
): Promise<ItemsAddition> {
	const addition = await db.transaction(async (tx) => {
		await lockList(tx, listId);
		const existing = await tx
			.select()
			.from(items)
			.where(eq(items.listId, listId));
		const byLabel = new Map(
			existing.map((row) => [normalizeItemLabel(row.label), row]),
		);

		const toCreate: string[] = [];
		const toRestore: string[] = [];
		const skipped: string[] = [];
		const seen = new Set<string>();
		for (const label of labels) {
			const key = normalizeItemLabel(label);
			const found = byLabel.get(key);
			if (seen.has(key)) {
				skipped.push(label);
			} else if (!found) {
				toCreate.push(label);
			} else if (found.done) {
				toRestore.push(found.id);
			} else if (whenTaken === "fail") {
				throw labelTaken();
			} else {
				skipped.push(label);
			}
			seen.add(key);
		}

		const start = Math.max(0, ...existing.map((row) => row.position)) + 1;
		const created =
			toCreate.length === 0
				? []
				: await tx
						.insert(items)
						.values(
							toCreate.map((label, index) => ({
								listId,
								label,
								position: start + index,
								createdById: userId,
							})),
						)
						.returning();
		const restored =
			toRestore.length === 0
				? []
				: await tx
						.update(items)
						.set({ done: false, doneAt: null, doneById: null })
						.where(and(eq(items.listId, listId), inArray(items.id, toRestore)))
						.returning();
		const byPosition = (a: Item, b: Item) => a.position - b.position;
		return {
			created: created.map(toItem).sort(byPosition),
			restored: restored.map(toItem).sort(byPosition),
			skipped,
		};
	});

	if (addition.created.length > 0) {
		listEvents.publish({
			type: "items.created",
			listId,
			actorId: userId,
			items: addition.created,
		});
	}
	if (addition.restored.length > 0) {
		listEvents.publish({
			type: "items.updated",
			listId,
			actorId: userId,
			items: addition.restored,
		});
	}
	return addition;
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

	const row = await db.transaction(async (tx) => {
		if (changes.label !== undefined) {
			await lockList(tx, listId);
			const key = normalizeItemLabel(changes.label);
			const others = await tx
				.select({ label: items.label })
				.from(items)
				.where(and(eq(items.listId, listId), ne(items.id, itemId)));
			if (others.some((other) => normalizeItemLabel(other.label) === key)) {
				throw labelTaken();
			}
		}
		const [updated] = await tx
			.update(items)
			.set(values)
			.where(inList(listId, itemId))
			.returning();
		return updated;
	});
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
