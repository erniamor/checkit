import { ApiError } from "@repo/resources";
import type { InvitationPreview, Profile } from "@repo/schemas";
import { Button, buttonVariants } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { FormAlert } from "@/components/FormAlert";
import { useSessionChange } from "@/features/auth/use-session-change";
import { JoinCard } from "@/features/sharing/JoinCard";
import { LinkUnavailable } from "@/features/sharing/LinkUnavailable";
import { useJoinList } from "@/features/sharing/use-join-list";
import { getApi } from "@/lib/api";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface InvitationPageProps {
	token: string;
	preview: InvitationPreview;
	/** The signed-in user, null for a visitor. */
	me: Profile | null;
}

/** The page of an invitation link: joining requires the invited email. */
export function InvitationPage({ token, preview, me }: InvitationPageProps) {
	const accept = useJoinList(() => getApi().invitations.accept(token));
	const session = useSessionChange();
	const here = `/invitations/${token}`;

	if (accept.error instanceof ApiError && accept.error.status === 410) {
		return (
			<LinkUnavailable
				title={m.invitation_expired_title()}
				text={m.invitation_expired_text()}
			/>
		);
	}

	return (
		<JoinCard
			listName={preview.listName}
			from={
				preview.invitedBy
					? m.invitation_from({ name: preview.invitedBy })
					: undefined
			}
			role={preview.role}
		>
			{!me ? (
				<Link
					to="/sign-in"
					search={{ redirect: here, email: preview.email }}
					className={buttonVariants()}
				>
					{m.sign_in_to_join()}
				</Link>
			) : me.email.toLowerCase() !== preview.email ? (
				<>
					<p role="alert">
						{m.invitation_wrong_account({
							email: preview.email,
							me: me.email,
						})}
					</p>
					<Button
						type="button"
						variant="outline"
						onClick={async () => {
							await getApi().auth.signOut();
							await session.clear(here);
						}}
					>
						{m.sign_out_to_switch()}
					</Button>
				</>
			) : (
				<>
					<Button
						type="button"
						disabled={accept.isPending}
						onClick={() => accept.mutate()}
					>
						{m.join_button()}
					</Button>
					<FormAlert
						message={accept.error ? formErrors(accept.error).form : undefined}
					/>
				</>
			)}
		</JoinCard>
	);
}
