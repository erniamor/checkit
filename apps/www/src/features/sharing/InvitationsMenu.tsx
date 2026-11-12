import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import { BellIcon } from "lucide-react";
import { headerButtonClass } from "@/components/header-styles";
import { ReceivedInvitationRow } from "@/features/sharing/ReceivedInvitationRow";
import { useReceivedInvitations } from "@/features/sharing/use-received-invitations";
import { m } from "@/paraglide/messages";

interface InvitationsMenuProps {
	userId: string;
}

/** The header's bell: invitations sent to the user, accepted or declined here. */
export function InvitationsMenu({ userId }: InvitationsMenuProps) {
	const { invitations, accept, decline, pendingId } =
		useReceivedInvitations(userId);
	const count = invitations.length;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={
						count > 0
							? m.invitations_menu_label_pending({ count: String(count) })
							: m.invitations_menu_label()
					}
					className={headerButtonClass}
				>
					<span className="relative">
						<BellIcon aria-hidden className="size-5" />
						{count > 0 && (
							<span
								aria-hidden
								className="-top-1.5 -right-1.5 absolute flex min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-[0.625rem] text-primary-foreground leading-4"
							>
								{count}
							</span>
						)}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				aria-label={m.invitations_menu_label()}
				className="w-80"
			>
				<h2 className="font-medium">{m.invitations_menu_label()}</h2>
				{count === 0 ? (
					<p className="text-muted-foreground">{m.invitations_none()}</p>
				) : (
					<ul className="divide-y divide-border">
						{invitations.map((invitation) => (
							<ReceivedInvitationRow
								key={invitation.id}
								invitation={invitation}
								disabled={pendingId === invitation.id}
								onAccept={() => accept.mutate(invitation)}
								onDecline={() => decline.mutate(invitation)}
							/>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}
