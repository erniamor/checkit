import {
	type List,
	type Paginated,
	type ShareableRole,
	type ShareLink,
	type ShareLinkPreview,
	shareableRoleSchema,
} from "@repo/schemas";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { listMembers, lists, shareLinks, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";
import { generateToken } from "@/lib/tokens";
import { getListOfUser } from "@/routes/lists/lists.service";
import {
	announceMembershipChange,
	grantRole,
	publicName,
} from "@/routes/members/members.service";

type ShareLinkRow = typeof shareLinks.$inferSelect;

function toShareLink(row: ShareLinkRow): ShareLink {
	return {
		id: row.id,
		listId: row.listId,
		// Only shareable roles are ever stored in share links
		role: shareableRoleSchema.parse(row.role),
		token: row.token,
		createdAt: row.createdAt.toISOString(),
	};
}

function shareLinkNotFound() {
	return new AppError(404, "share_link_not_found", "Share link not found");
}

function active(listId: string) {
	return and(eq(shareLinks.listId, listId), isNull(shareLinks.revokedAt));
}

/** Creates the list's link for `role`, revoking the previous one for that role. */
export async function createShareLink(
	listId: string,
	userId: string,
	role: ShareableRole,
): Promise<ShareLink> {
	return db.transaction(async (tx) => {
		await tx
			.update(shareLinks)
			.set({ revokedAt: new Date() })
			.where(and(active(listId), eq(shareLinks.role, role)));
		const [row] = await tx
			.insert(shareLinks)
			.values({ listId, role, token: generateToken(), createdById: userId })
			.returning();
		if (!row) {
			throw new Error("Share link insert returned no row");
		}
		return toShareLink(row);
	});
}

export async function listActiveShareLinks(
	listId: string,
	query: PaginationQuery,
): Promise<Paginated<ShareLink>> {
	const [rows, [totalRow]] = await Promise.all([
		db
			.select()
			.from(shareLinks)
			.where(active(listId))
			.orderBy(asc(shareLinks.createdAt), asc(shareLinks.id))
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db.select({ total: count() }).from(shareLinks).where(active(listId)),
	]);

	return {
		data: rows.map(toShareLink),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

export async function revokeShareLink(
	listId: string,
	linkId: string,
): Promise<void> {
	const revoked = await db
		.update(shareLinks)
		.set({ revokedAt: new Date() })
		.where(and(eq(shareLinks.id, linkId), active(listId)))
		.returning({ id: shareLinks.id });
	if (revoked.length === 0) {
		throw shareLinkNotFound();
	}
}

/** Finds an active link by its token: 404 if unknown, 410 if revoked. */
async function findActiveByToken(token: string): Promise<ShareLinkRow> {
	const [row] = await db
		.select()
		.from(shareLinks)
		.where(eq(shareLinks.token, token));
	if (!row) {
		throw shareLinkNotFound();
	}
	if (row.revokedAt) {
		throw new AppError(
			410,
			"share_link_revoked",
			"This share link was revoked",
		);
	}
	return row;
}

/** What the share link shows, before signing in. */
export async function previewShareLink(
	token: string,
): Promise<ShareLinkPreview> {
	const link = await findActiveByToken(token);
	const [list] = await db
		.select({ name: lists.name, ownerName: users.name })
		.from(lists)
		.innerJoin(
			listMembers,
			and(eq(listMembers.listId, lists.id), eq(listMembers.role, "owner")),
		)
		.innerJoin(users, eq(users.id, listMembers.userId))
		.where(eq(lists.id, link.listId));
	if (!list) {
		throw shareLinkNotFound();
	}
	return {
		listId: link.listId,
		listName: list.name,
		role: shareableRoleSchema.parse(link.role),
		owner: publicName(list.ownerName),
	};
}

/** Joins the list through the link; an existing member is never downgraded. */
export async function joinWithShareLink(
	token: string,
	userId: string,
): Promise<List> {
	const link = await findActiveByToken(token);
	const change = await grantRole(
		db,
		link.listId,
		userId,
		shareableRoleSchema.parse(link.role),
	);
	await announceMembershipChange(link.listId, userId, change);
	return getListOfUser(link.listId, userId);
}
