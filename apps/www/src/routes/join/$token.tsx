import { createFileRoute } from "@tanstack/react-router";
import { LinkUnavailable } from "@/features/sharing/LinkUnavailable";
import { loadPreview } from "@/features/sharing/load-preview";
import { ShareLinkPage } from "@/features/sharing/ShareLinkPage";
import { getApi } from "@/lib/api";
import { m } from "@/paraglide/messages";

// A share link: public, so a visitor sees the list's name before signing in
export const Route = createFileRoute("/join/$token")({
	loader: ({ params }) =>
		loadPreview(() => getApi().shareLinks.preview(params.token)),
	component: ShareLinkRoute,
});

function ShareLinkRoute() {
	const { token } = Route.useParams();
	const { preview } = Route.useLoaderData();
	const { me } = Route.useRouteContext();

	if (!preview) {
		return (
			<LinkUnavailable
				title={m.share_link_revoked_title()}
				text={m.share_link_revoked_text()}
			/>
		);
	}
	return <ShareLinkPage token={token} preview={preview} me={me} />;
}
