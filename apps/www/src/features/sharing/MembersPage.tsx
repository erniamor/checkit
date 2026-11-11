import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { isOwner } from "@/features/lists/permissions";
import { listQueryOptions } from "@/features/lists/queries";
import { InviteSection } from "@/features/sharing/InviteSection";
import { MemberRow } from "@/features/sharing/MemberRow";
import { membersQueryOptions } from "@/features/sharing/queries";
import { ShareLinksSection } from "@/features/sharing/ShareLinksSection";
import { useSharing } from "@/features/sharing/use-sharing";
import { m } from "@/paraglide/messages";

interface MembersPageProps {
	listId: string;
	meId: string;
}

/** "Members and sharing": the members, and for the owner, how to share the list. */
export function MembersPage({ listId, meId }: MembersPageProps) {
	const { data: list } = useSuspenseQuery(listQueryOptions(listId));
	const { data: members } = useSuspenseQuery(membersQueryOptions(listId));
	const sharing = useSharing(listId);
	const membersTitleId = useId();
	const owner = isOwner(list.role);
	const memberPending =
		sharing.updateRole.isPending || sharing.removeMember.isPending;

	return (
		<section className="mx-auto grid max-w-2xl gap-8 px-4 py-8">
			<Link
				to="/lists/$listId"
				params={{ listId }}
				className="text-muted-foreground text-sm underline-offset-4 hover:underline"
			>
				← {list.name}
			</Link>
			<h1 className="font-heading font-semibold text-2xl">
				{m.members_title()}
			</h1>

			<section aria-labelledby={membersTitleId} className="grid gap-2">
				<h2 id={membersTitleId} className="font-heading font-semibold text-lg">
					{m.members_section()}
				</h2>
				<ul className="divide-y divide-border">
					{members.items.map((member) => (
						<MemberRow
							key={member.userId}
							member={member}
							isMe={member.userId === meId}
							manageable={owner}
							pending={memberPending}
							onRoleChange={(role) =>
								sharing.updateRole.mutate({ userId: member.userId, role })
							}
							onRemove={() => sharing.removeMember.mutate(member.userId)}
						/>
					))}
				</ul>
				{!owner && (
					<div>
						<ConfirmButton
							label={m.leave_list_button()}
							title={m.leave_list_title({ name: list.name })}
							description={m.leave_list_text()}
							confirmLabel={m.leave_list_confirm()}
							pending={sharing.leave.isPending}
							onConfirm={() => sharing.leave.mutate()}
						/>
					</div>
				)}
			</section>

			{owner && <InviteSection listId={listId} sharing={sharing} />}
			{owner && <ShareLinksSection listId={listId} sharing={sharing} />}
		</section>
	);
}
