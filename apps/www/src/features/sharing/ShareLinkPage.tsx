import { ApiError } from "@repo/resources";
import type { Profile, ShareLinkPreview } from "@repo/schemas";
import { Button, buttonVariants } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { FormAlert } from "@/components/FormAlert";
import { JoinCard } from "@/features/sharing/JoinCard";
import { LinkUnavailable } from "@/features/sharing/LinkUnavailable";
import { useJoinList } from "@/features/sharing/use-join-list";
import { getApi } from "@/lib/api";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface ShareLinkPageProps {
	token: string;
	preview: ShareLinkPreview;
	/** The signed-in user, null for a visitor. */
	me: Profile | null;
}

/** The page of a share link: any signed-in user can join. */
export function ShareLinkPage({ token, preview, me }: ShareLinkPageProps) {
	const join = useJoinList(() => getApi().shareLinks.join(token));

	if (join.error instanceof ApiError && join.error.status === 410) {
		return (
			<LinkUnavailable
				title={m.share_link_revoked_title()}
				text={m.share_link_revoked_text()}
			/>
		);
	}

	return (
		<JoinCard
			listName={preview.listName}
			from={
				preview.owner ? m.share_link_from({ name: preview.owner }) : undefined
			}
			role={preview.role}
		>
			{me ? (
				<>
					<Button
						type="button"
						disabled={join.isPending}
						onClick={() => join.mutate()}
					>
						{m.join_button()}
					</Button>
					<FormAlert
						message={join.error ? formErrors(join.error).form : undefined}
					/>
				</>
			) : (
				<Link
					to="/sign-in"
					search={{ redirect: `/join/${token}` }}
					className={buttonVariants()}
				>
					{m.sign_in_to_join()}
				</Link>
			)}
		</JoinCard>
	);
}
