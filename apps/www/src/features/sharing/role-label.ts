import type { MemberRole } from "@repo/schemas";
import { m } from "@/paraglide/messages";

const labels: Record<MemberRole, () => string> = {
	owner: m.role_owner,
	editor: m.role_editor,
	viewer: m.role_viewer,
};

/** What a role allows, in words: "Can edit", "Can view"... */
export function roleLabel(role: MemberRole): string {
	return labels[role]();
}
