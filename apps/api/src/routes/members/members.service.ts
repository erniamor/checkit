import type { Member, MemberRole, Paginated } from "@repo/schemas";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { listMembers, users } from "@/db/schema";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";

const roleRank: Record<MemberRole, number> = {
	viewer: 0,
	editor: 1,
	owner: 2,
};

export function hasRoleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
	return roleRank[role] >= roleRank[minimum];
}

/** The user's role on the list, or null if they aren't a member. */
export async function findMemberRole(
	listId: string,
	userId: string,
): Promise<MemberRole | null> {
	const [membership] = await db
		.select({ role: listMembers.role })
		.from(listMembers)
		.where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));
	return membership?.role ?? null;
}

export async function listMembersOf(
	listId: string,
	query: PaginationQuery,
): Promise<Paginated<Member>> {
	const [rows, [totalRow]] = await Promise.all([
		db
			.select({
				userId: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				role: listMembers.role,
				joinedAt: listMembers.createdAt,
			})
			.from(listMembers)
			.innerJoin(users, eq(users.id, listMembers.userId))
			.where(eq(listMembers.listId, listId))
			.orderBy(asc(listMembers.createdAt), asc(users.id))
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db
			.select({ total: count() })
			.from(listMembers)
			.where(eq(listMembers.listId, listId)),
	]);

	return {
		data: rows.map((row) => ({
			...row,
			joinedAt: row.joinedAt.toISOString(),
		})),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}
