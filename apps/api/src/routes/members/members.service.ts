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
import { listEvents } from "@/realtime/list-events";

const roleRank: Record<MemberRole, number> = {
	viewer: 0,
	editor: 1,
	owner: 2,
};

export function hasRoleAtLeast(role: MemberRole, minimum: MemberRole): boolean {
	return roleRank[role] >= roleRank[minimum];
}

/**
 * Name shown to people the user chose to contact (members, invited people):
 * the user's name, or their email if they have none.
 */
export function displayName(user: { name: string; email: string }): string {
	return user.name || user.email;
}

/**
 * Name shown on public pages (invitation and share link previews): the user's
 * name only, null if they have none, so their email is never exposed.
 */
export function publicName(name: string | null | undefined): string | null {
	return name?.trim() || null;
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

export type MembershipChange = "added" | "upgraded" | null;

/**
 * Makes the user a member of the list with `role`. An existing member is
 * upgraded from viewer to editor, never downgraded. Returns what changed.
 */
export async function grantRole(
	executor: Database | Transaction,
	listId: string,
	userId: string,
	role: ShareableRole,
): Promise<MembershipChange> {
	const inserted = await executor
		.insert(listMembers)
		.values({ listId, userId, role })
		.onConflictDoNothing()
		.returning({ userId: listMembers.userId });
	if (inserted.length > 0) {
		return "added";
	}
	if (role === "viewer") {
		return null;
	}
	const upgraded = await executor
		.update(listMembers)
		.set({ role })
		.where(and(isMember(listId, userId), eq(listMembers.role, "viewer")))
		.returning({ userId: listMembers.userId });
	return upgraded.length > 0 ? "upgraded" : null;
}

/** Tells the list's members about a change made by `grantRole`, once committed. */
export async function announceMembershipChange(
	listId: string,
	userId: string,
	change: MembershipChange,
): Promise<void> {
	if (!change) {
		return;
	}
	listEvents.publish({
		type: change === "added" ? "member.added" : "member.updated",
		listId,
		actorId: userId,
		member: await getMember(listId, userId),
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
	actorId: string,
): Promise<Member> {
	await assertChangeableMember(listId, userId);
	await db.update(listMembers).set({ role }).where(isMember(listId, userId));
	const member = await getMember(listId, userId);
	listEvents.publish({ type: "member.updated", listId, actorId, member });
	return member;
}

export async function removeMember(
	listId: string,
	userId: string,
	actorId: string,
): Promise<void> {
	await assertChangeableMember(listId, userId);
	await db.delete(listMembers).where(isMember(listId, userId));
	listEvents.publish({ type: "member.removed", listId, actorId, userId });
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
	listEvents.publish({
		type: "member.removed",
		listId,
		actorId: userId,
		userId,
	});
}
