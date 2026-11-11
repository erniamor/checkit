import type { Profile } from "@repo/schemas";
import { useMutation } from "@tanstack/react-query";
import { useSessionChange } from "@/features/auth/use-session-change";
import { getApi } from "@/lib/api";
import { m } from "@/paraglide/messages";

interface UserMenuProps {
	me: Profile;
}

/** The signed-in user's name and the sign-out button, in the header. */
export function UserMenu({ me }: UserMenuProps) {
	const session = useSessionChange();
	const signOut = useMutation({
		mutationFn: () => getApi().auth.signOut(),
		onSuccess: () => session.clear("/"),
	});

	return (
		<div className="flex items-center gap-3">
			<span className="hidden text-sm sm:inline">
				{m.signed_in_as({ name: me.name || me.email })}
			</span>
			<button
				type="button"
				onClick={() => signOut.mutate()}
				disabled={signOut.isPending}
				className="h-9 rounded-md border border-inverse-border px-3 text-sm hover:bg-inverse-foreground/10 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-50"
			>
				{m.sign_out_button()}
			</button>
		</div>
	);
}
