import { createFileRoute } from "@tanstack/react-router";
import { InvitationPage } from "@/features/sharing/InvitationPage";
import { LinkUnavailable } from "@/features/sharing/LinkUnavailable";
import { loadPreview } from "@/features/sharing/load-preview";
import { getApi } from "@/lib/api";
import { m } from "@/paraglide/messages";

// The link of an invitation email: public, so a visitor sees what they're
// invited to before signing in
export const Route = createFileRoute("/invitations/$token")({
	loader: ({ params }) =>
		loadPreview(() => getApi().invitations.preview(params.token)),
	component: InvitationRoute,
});

function InvitationRoute() {
	const { token } = Route.useParams();
	const { preview } = Route.useLoaderData();
	const { me } = Route.useRouteContext();

	if (!preview) {
		return (
			<LinkUnavailable
				title={m.invitation_expired_title()}
				text={m.invitation_expired_text()}
			/>
		);
	}
	return <InvitationPage token={token} preview={preview} me={me} />;
}
