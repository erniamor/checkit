import {
	type Invitation,
	type InvitationPreview,
	type List,
	type Paginated,
	type ShareableRole,
	shareableRoleSchema,
} from "@repo/schemas";
import { and, asc, count, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, listMembers, lists, users } from "@/db/schema";
import { invitationEmail } from "@/emails/invitation";
import { env } from "@/env";
import { AppError } from "@/lib/errors";
import type { Locale } from "@/lib/locale";
import { mailer } from "@/lib/mailer";
import { offsetOf, type PaginationQuery } from "@/lib/pagination";
import { generateToken, hashToken } from "@/lib/tokens";
import { getListOfUser } from "@/routes/lists/lists.service";
import {
	announceMembershipChange,
	displayName,
	grantRole,
	publicName,
} from "@/routes/members/members.service";

const INVITATION_EXPIRES_IN_DAYS = 7;
/** Limits invitation spam: pending invitations a list can have at once. */
export const MAX_PENDING_INVITATIONS = 50;

type InvitationRow = typeof invitations.$inferSelect;

function toInvitation(row: InvitationRow): Invitation {
	return {
		id: row.id,
		listId: row.listId,
		email: row.email,
		// Only shareable roles are ever stored in invitations
		role: shareableRoleSchema.parse(row.role),
		invitedById: row.invitedById,
		expiresAt: row.expiresAt.toISOString(),
		createdAt: row.createdAt.toISOString(),
	};
}

function invitationNotFound() {
	return new AppError(404, "invitation_not_found", "Invitation not found");
}

function invitationExpired() {
	return new AppError(
		410,
		"invitation_expired",
		"This invitation has expired or was already used",
	);
}

function pending(listId: string) {
	return and(
		eq(invitations.listId, listId),
		isNull(invitations.acceptedAt),
		gt(invitations.expiresAt, new Date()),
	);
}

interface CreateInvitationInput {
	listId: string;
	inviter: { id: string; name: string; email: string };
	email: string;
	role: ShareableRole;
	/** Language of the email: the invited person's is unknown, so the inviter's. */
	locale: Locale;
}

/**
 * Invites someone to the list by email. Inviting the same email again replaces
 * the pending invitation and sends a new link.
 */
export async function createInvitation({
	listId,
	inviter,
	email,
	role,
	locale,
}: CreateInvitationInput): Promise<Invitation> {
	return db.transaction(async (tx) => {
		const [member] = await tx
			.select({ userId: listMembers.userId })
			.from(listMembers)
			.innerJoin(users, eq(users.id, listMembers.userId))
			.where(and(eq(listMembers.listId, listId), eq(users.email, email)));
		if (member) {
			throw new AppError(
				409,
				"already_member",
				"This person is already a member of the list",
			);
		}

		await tx
			.delete(invitations)
			.where(
				and(
					eq(invitations.listId, listId),
					eq(invitations.email, email),
					isNull(invitations.acceptedAt),
				),
			);
		const [pendingRow] = await tx
			.select({ total: count() })
			.from(invitations)
			.where(pending(listId));
		if ((pendingRow?.total ?? 0) >= MAX_PENDING_INVITATIONS) {
			throw new AppError(
				429,
				"too_many_invitations",
				"This list has too many pending invitations",
			);
		}

		const token = generateToken();
		const [row] = await tx
			.insert(invitations)
			.values({
				listId,
				email,
				role,
				tokenHash: hashToken(token),
				invitedById: inviter.id,
				expiresAt: new Date(
					Date.now() + INVITATION_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
				),
			})
			.returning();
		const [list] = await tx
			.select({ name: lists.name })
			.from(lists)
			.where(eq(lists.id, listId));
		if (!row || !list) {
			throw new Error("Invitation insert returned no row");
		}

		// Sent inside the transaction: if the email fails, no invitation is left
		// behind without its link
		await mailer.send(
			invitationEmail({
				to: email,
				inviter: displayName(inviter),
				listName: list.name,
				role,
				url: `${env.APP_URL}/invitations/${token}`,
				locale,
				expiresInDays: INVITATION_EXPIRES_IN_DAYS,
			}),
		);
		return toInvitation(row);
	});
}

export async function listPendingInvitations(
	listId: string,
	query: PaginationQuery,
): Promise<Paginated<Invitation>> {
	const [rows, [totalRow]] = await Promise.all([
		db
			.select()
			.from(invitations)
			.where(pending(listId))
			.orderBy(asc(invitations.createdAt), asc(invitations.id))
			.limit(query.pageSize)
			.offset(offsetOf(query)),
		db.select({ total: count() }).from(invitations).where(pending(listId)),
	]);

	return {
		data: rows.map(toInvitation),
		pagination: { ...query, total: totalRow?.total ?? 0 },
	};
}

export async function revokeInvitation(
	listId: string,
	invitationId: string,
): Promise<void> {
	const deleted = await db
		.delete(invitations)
		.where(
			and(
				eq(invitations.id, invitationId),
				eq(invitations.listId, listId),
				isNull(invitations.acceptedAt),
			),
		)
		.returning({ id: invitations.id });
	if (deleted.length === 0) {
		throw invitationNotFound();
	}
}

async function findByToken(token: string) {
	const [row] = await db
		.select({
			invitation: invitations,
			listName: lists.name,
			inviterName: users.name,
		})
		.from(invitations)
		.innerJoin(lists, eq(lists.id, invitations.listId))
		.leftJoin(users, eq(users.id, invitations.invitedById))
		.where(eq(invitations.tokenHash, hashToken(token)));
	return row ?? null;
}

function isExpired(invitation: InvitationRow): boolean {
	return invitation.expiresAt <= new Date();
}

/** What the invitation link shows, before signing in. */
export async function previewInvitation(
	token: string,
): Promise<InvitationPreview> {
	const found = await findByToken(token);
	if (!found) {
		throw invitationNotFound();
	}
	const { invitation, listName, inviterName } = found;
	if (invitation.acceptedAt || isExpired(invitation)) {
		throw invitationExpired();
	}
	return {
		listId: invitation.listId,
		listName,
		role: shareableRoleSchema.parse(invitation.role),
		email: invitation.email,
		invitedBy: publicName(inviterName),
		expiresAt: invitation.expiresAt.toISOString(),
	};
}

/**
 * Accepts the invitation for the signed-in user, who must use the invited
 * email. Accepting again an invitation already used by the user is harmless.
 */
export async function acceptInvitation(
	token: string,
	user: { id: string; email: string },
): Promise<List> {
	const found = await findByToken(token);
	if (!found) {
		throw invitationNotFound();
	}
	const { invitation } = found;
	if (invitation.email !== user.email.toLowerCase()) {
		throw new AppError(
			403,
			"invitation_email_mismatch",
			"This invitation was sent to another email address",
		);
	}
	if (invitation.acceptedAt) {
		// Opening the link twice: the user is already a member
		return getListOfUser(invitation.listId, user.id).catch(() => {
			throw invitationExpired();
		});
	}
	if (isExpired(invitation)) {
		throw invitationExpired();
	}

	const change = await db.transaction(async (tx) => {
		const granted = await grantRole(
			tx,
			invitation.listId,
			user.id,
			shareableRoleSchema.parse(invitation.role),
		);
		await tx
			.update(invitations)
			.set({ acceptedAt: new Date() })
			.where(eq(invitations.id, invitation.id));
		return granted;
	});
	await announceMembershipChange(invitation.listId, user.id, change);
	return getListOfUser(invitation.listId, user.id);
}
