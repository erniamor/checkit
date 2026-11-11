import { useSuspenseQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useId } from "react";
import { IconButton } from "@/components/IconButton";
import { InviteForm } from "@/features/sharing/InviteForm";
import { invitationsQueryOptions } from "@/features/sharing/queries";
import { roleLabel } from "@/features/sharing/role-label";
import type { Sharing } from "@/features/sharing/use-sharing";
import { m } from "@/paraglide/messages";

interface InviteSectionProps {
	listId: string;
	sharing: Sharing;
}

/** Owner only: invites by email, and the invitations still pending. */
export function InviteSection({ listId, sharing }: InviteSectionProps) {
	const { data: invitations } = useSuspenseQuery(
		invitationsQueryOptions(listId),
	);
	const titleId = useId();
	const pendingTitleId = useId();

	return (
		<section aria-labelledby={titleId} className="grid gap-4">
			<h2 id={titleId} className="font-heading font-semibold text-lg">
				{m.invite_section()}
			</h2>
			<InviteForm
				onInvite={(input) => sharing.invite.mutateAsync(input)}
				pending={sharing.invite.isPending}
				error={sharing.invite.error}
			/>
			{invitations.items.length > 0 && (
				<section aria-labelledby={pendingTitleId}>
					<h3
						id={pendingTitleId}
						className="font-medium text-muted-foreground text-sm"
					>
						{m.pending_invitations()}
					</h3>
					<ul className="divide-y divide-border">
						{invitations.items.map((invitation) => (
							<li
								key={invitation.id}
								className="flex flex-wrap items-center justify-between gap-2 py-2"
							>
								<span className="break-all">
									{invitation.email}
									<span className="text-muted-foreground text-sm">
										{" "}
										· {roleLabel(invitation.role)}
									</span>
								</span>
								<IconButton
									icon={XIcon}
									label={m.cancel_invitation_label({
										email: invitation.email,
									})}
									tooltip={m.cancel_button()}
									disabled={sharing.cancelInvitation.isPending}
									onClick={() => sharing.cancelInvitation.mutate(invitation.id)}
								/>
							</li>
						))}
					</ul>
				</section>
			)}
		</section>
	);
}
