import type { Profile } from "@repo/schemas";
import { toast } from "@repo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { meQueryKey } from "@/features/auth/me-query";
import { NameForm } from "@/features/profile/NameForm";
import { m } from "@/paraglide/messages";

interface ProfilePageProps {
	me: Profile;
}

/** The signed-in user's profile: their email, and their name to change. */
export function ProfilePage({ me }: ProfilePageProps) {
	const queryClient = useQueryClient();
	const router = useRouter();

	return (
		<section className="mx-auto grid max-w-md gap-6 px-4 py-12">
			<header className="grid gap-2">
				<h1 className="font-heading font-semibold text-2xl">
					{m.profile_title()}
				</h1>
				<p className="text-muted-foreground">{m.profile_intro()}</p>
			</header>
			<dl className="grid gap-1">
				<dt className="font-medium text-sm">{m.profile_email_label()}</dt>
				<dd className="break-all text-muted-foreground">{me.email}</dd>
			</dl>
			<NameForm
				defaultName={me.name}
				submitLabel={m.save_button()}
				onSaved={async (profile) => {
					queryClient.setQueryData(meQueryKey, profile);
					toast.success(m.toast_profile_saved());
					// The header shows the name from the route context
					await router.invalidate();
				}}
			/>
		</section>
	);
}
