import type { Profile } from "@repo/schemas";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	CircleUserRoundIcon,
	DownloadIcon,
	LogOutIcon,
	UserIcon,
} from "lucide-react";
import { useState } from "react";
import { headerButtonClass } from "@/components/header-styles";
import { useSessionChange } from "@/features/auth/use-session-change";
import { IosInstallDialog } from "@/features/pwa/IosInstallDialog";
import { useInstall } from "@/features/pwa/use-install";
import { getApi } from "@/lib/api";
import { m } from "@/paraglide/messages";

interface UserMenuProps {
	me: Profile;
}

/** The signed-in user's menu in the header: profile, installing the app, sign-out. */
export function UserMenu({ me }: UserMenuProps) {
	const session = useSessionChange();
	const signOut = useMutation({
		mutationFn: () => getApi().auth.signOut(),
		onSuccess: () => session.clear("/"),
	});
	const name = me.name || me.email;
	const installation = useInstall();
	const [iosHelpOpen, setIosHelpOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						aria-label={m.account_menu_label({ name })}
						className={headerButtonClass}
					>
						<CircleUserRoundIcon aria-hidden className="size-6" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-56">
					<DropdownMenuLabel className="grid gap-0.5">
						<span className="truncate">{name}</span>
						{me.name && (
							<span className="truncate font-normal text-muted-foreground text-xs">
								{me.email}
							</span>
						)}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link to="/profile">
							<UserIcon aria-hidden className="size-4" />
							{m.profile_link()}
						</Link>
					</DropdownMenuItem>
					{installation.installable && (
						<DropdownMenuItem
							onSelect={() =>
								installation.state === "ios"
									? setIosHelpOpen(true)
									: installation.install()
							}
						>
							<DownloadIcon aria-hidden className="size-4" />
							{m.install_menu_item()}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						disabled={signOut.isPending}
						onSelect={() => signOut.mutate()}
					>
						<LogOutIcon aria-hidden className="size-4" />
						{m.sign_out_button()}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{/* Outside the menu, which closes when the item is chosen */}
			<IosInstallDialog open={iosHelpOpen} onOpenChange={setIosHelpOpen} />
		</>
	);
}
