import type { CreateList, List, Paginated, UpdateList } from "@repo/schemas";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { items, listMembers, lists } from "@/db/schema";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";
import { listNotFound } from "@/middlewares/require-list-role";
import { listEvents } from "@/realtime/list-events";

const listColumns = {
	id: lists.id,
	name: lists.name,
	kind: lists.kind,
	role: listMembers.role,
	itemCount:
		sql<number>`(select count(*) from ${items} where ${items.listId} = ${lists.id})`.mapWith(
			Number,
		),
	doneCount:
		sql<number>`(select count(*) from ${items} where ${items.listId} = ${lists.id} and ${items.done})`.mapWith(
			Number,
		),
	createdAt: lists.createdAt,
	updatedAt: lists.updatedAt,
};

type ListRow = Omit<List, "createdAt" | "updatedAt"> & {
	createdAt: Date;
	updatedAt: Date;
};

function toList(row: ListRow): List {
	return {
		...row,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function selectListsOfUser(userId: string) {
	return db
		.select(listColumns)
		.from(listMembers)
		.innerJoin(lists, eq(lists.id, listMembers.listId))
		.where(eq(listMembers.userId, userId))
		.$dynamic();
}

/** Lists the user is a member of, most recently created first. */
export async function listListsOfUser(
	userId: string,
	query: PaginationQuery,
): Promise<Paginated<List>> {
	const [rows, [totalRow]] = await Promise.all([
		selectListsOfUser(userId)
			.orderBy(desc(lists.createdAt), desc(lists.id))
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db
			.select({ total: count() })
			.from(listMembers)
			.where(eq(listMembers.userId, userId)),
	]);

	return {
		data: rows.map(toList),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

export async function getListOfUser(
	listId: string,
	userId: string,
): Promise<List> {
	const [row] = await db
		.select(listColumns)
		.from(listMembers)
		.innerJoin(lists, eq(lists.id, listMembers.listId))
		.where(and(eq(listMembers.userId, userId), eq(lists.id, listId)));
	if (!row) {
		throw listNotFound();
	}
	return toList(row);
}

/** Creates a list owned by the user. */
export async function createList(
	userId: string,
	input: CreateList,
): Promise<List> {
	return db.transaction(async (tx) => {
		const [list] = await tx.insert(lists).values(input).returning();
		if (!list) {
			throw new Error("List insert returned no row");
		}
		await tx
			.insert(listMembers)
			.values({ listId: list.id, userId, role: "owner" });
		return toList({ ...list, role: "owner", itemCount: 0, doneCount: 0 });
	});
}

/** Renames the list and/or changes its kind. */
export async function updateList(
	listId: string,
	userId: string,
	input: UpdateList,
): Promise<List> {
	await db.update(lists).set(input).where(eq(lists.id, listId));
	const list = await getListOfUser(listId, userId);
	listEvents.publish({
		type: "list.updated",
		listId,
		actorId: userId,
		name: list.name,
		kind: list.kind,
		updatedAt: list.updatedAt,
	});
	return list;
}

/** Deletes the list with its members and items (cascade). */
export async function deleteList(
	listId: string,
	userId: string,
): Promise<void> {
	await db.delete(lists).where(eq(lists.id, listId));
	listEvents.publish({ type: "list.deleted", listId, actorId: userId });
}
