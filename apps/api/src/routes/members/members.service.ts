import type {
	Member,
	MemberRole,
	Paginated,
	ShareableRole,
} from "@repo/schemas";
import { and, asc, count, eq } from "drizzle-orm";
import { type Database, db, type Transaction } from "@/db/client";
import { listMembers, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";

const roleRank: Record<MemberRole, number> = {
	viewer: 0,
	editor: 1,
	owner: 2,
};

export function hasRoleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
	return roleRank[role] >= roleRank[minimum];
}

/** Name shown to other users: the user's name, or their email if they have none. */
export function displayName(user: { name: string; email: string }): string {
	return user.name || user.email;
}

function memberNotFound() {
	return new AppError(404, "member_not_found", "Member not found");
}

function isMember(listId: string, userId: string) {
	return and(eq(listMembers.listId, listId), eq(listMembers.userId, userId));
}

/** The user's role on the list, or null if they aren't a member. */
export async function findMemberRole(
	listId: string,
	userId: string,
): Promise<MemberRole | null> {
	const [membership] = await db
		.select({ role: listMembers.role })
		.from(listMembers)
		.where(isMember(listId, userId));
	return membership?.role ?? null;
}

const memberColumns = {
	userId: users.id,
	name: users.name,
	email: users.email,
	image: users.image,
	role: listMembers.role,
	joinedAt: listMembers.createdAt,
};

function toMember(row: Omit<Member, "joinedAt"> & { joinedAt: Date }): Member {
	return { ...row, joinedAt: row.joinedAt.toISOString() };
}

export async function listMembersOf(
	listId: string,
	query: PaginationQuery,
): Promise<Paginated<Member>> {
	const [rows, [totalRow]] = await Promise.all([
		db
			.select(memberColumns)
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
		data: rows.map(toMember),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

async function getMember(listId: string, userId: string): Promise<Member> {
	const [row] = await db
		.select(memberColumns)
		.from(listMembers)
		.innerJoin(users, eq(users.id, listMembers.userId))
		.where(isMember(listId, userId));
	if (!row) {
		throw memberNotFound();
	}
	return toMember(row);
}

/**
 * Makes the user a member of the list with `role`. An existing member is
 * upgraded from viewer to editor, never downgraded.
 */
export async function grantRole(
	executor: Database | Transaction,
	listId: string,
	userId: string,
	role: ShareableRole,
): Promise<void> {
	const insert = executor.insert(listMembers).values({ listId, userId, role });
	if (role === "viewer") {
		await insert.onConflictDoNothing();
		return;
	}
	await insert.onConflictDoUpdate({
		target: [listMembers.listId, listMembers.userId],
		set: { role },
		setWhere: eq(listMembers.role, "viewer"),
	});
}

/** Checks that the user is a member other than the owner, whose role is fixed. */
async function assertChangeableMember(listId: string, userId: string) {
	const role = await findMemberRole(listId, userId);
	if (!role) {
		throw memberNotFound();
	}
	if (role === "owner") {
		throw new AppError(
			409,
			"owner_role_locked",
			"The owner's membership can't be changed",
		);
	}
}

export async function updateMemberRole(
	listId: string,
	userId: string,
	role: ShareableRole,
): Promise<Member> {
	await assertChangeableMember(listId, userId);
	await db.update(listMembers).set({ role }).where(isMember(listId, userId));
	return getMember(listId, userId);
}

export async function removeMember(
	listId: string,
	userId: string,
): Promise<void> {
	await assertChangeableMember(listId, userId);
	await db.delete(listMembers).where(isMember(listId, userId));
}

/** Removes the user from the list; the owner can't leave, only delete the list. */
export async function leaveList(
	listId: string,
	userId: string,
	role: MemberRole,
): Promise<void> {
	if (role === "owner") {
		throw new AppError(
			409,
			"owner_cannot_leave",
			"The owner can't leave the list; delete it instead",
		);
	}
	await db.delete(listMembers).where(isMember(listId, userId));
}
