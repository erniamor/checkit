import type { ReceivedInvitation } from "@repo/schemas";
import { Button } from "@repo/ui";
import { roleLabel } from "@/features/sharing/role-label";
import { m } from "@/paraglide/messages";

interface ReceivedInvitationRowProps {
	invitation: ReceivedInvitation;
	disabled: boolean;
	onAccept: () => void;
	onDecline: () => void;
}

export function ReceivedInvitationRow({
	invitation,
	disabled,
	onAccept,
	onDecline,
}: ReceivedInvitationRowProps) {
	const list = invitation.listName;

	return (
		<li className="grid gap-2 py-2">
			<p className="break-words">
				{invitation.invitedBy
					? m.invitation_received({ name: invitation.invitedBy, list })
					: m.invitation_received_anonymous({ list })}
				<span className="block text-muted-foreground text-xs">
					{roleLabel(invitation.role)}
				</span>
			</p>
			<div className="flex gap-2">
				<Button
					type="button"
					size="sm"
					aria-label={m.invitation_accept_label({ list })}
					disabled={disabled}
					onClick={onAccept}
				>
					{m.invitation_accept_button()}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					aria-label={m.invitation_decline_label({ list })}
					disabled={disabled}
					onClick={onDecline}
				>
					{m.invitation_decline_button()}
				</Button>
			</div>
		</li>
	);
}
