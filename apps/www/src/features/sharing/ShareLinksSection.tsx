import { shareableRoleSchema } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useId } from "react";
import { shareLinksQueryOptions } from "@/features/sharing/queries";
import { ShareLinkCard } from "@/features/sharing/ShareLinkCard";
import type { Sharing } from "@/features/sharing/use-sharing";
import { m } from "@/paraglide/messages";

interface ShareLinksSectionProps {
	listId: string;
	sharing: Sharing;
}

/** Owner only: one link per role. */
export function ShareLinksSection({ listId, sharing }: ShareLinksSectionProps) {
	const { data: links } = useSuspenseQuery(shareLinksQueryOptions(listId));
	const titleId = useId();
	const pending = sharing.createLink.isPending || sharing.revokeLink.isPending;

	return (
		<section aria-labelledby={titleId} className="grid gap-3">
			<h2 id={titleId} className="font-heading font-semibold text-lg">
				{m.share_links_section()}
			</h2>
			<p className="text-muted-foreground text-sm">{m.share_links_intro()}</p>
			{shareableRoleSchema.options.map((role) => (
				<ShareLinkCard
					key={role}
					role={role}
					link={links.items.find((link) => link.role === role)}
					pending={pending}
					onCreate={() => sharing.createLink.mutate(role)}
					onRevoke={(linkId) => sharing.revokeLink.mutate(linkId)}
				/>
			))}
		</section>
	);
}
