import type { MemberRole } from "@repo/schemas";

// Mirrors the API's rules, to show only the actions the user can do; the API
// enforces them anyway

/** Editors and the owner change the items and rename the list. */
export function canEdit(role: MemberRole): boolean {
	return role !== "viewer";
}

/** Only the owner deletes the list. */
export function isOwner(role: MemberRole): boolean {
	return role === "owner";
}
