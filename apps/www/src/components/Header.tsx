import type { Profile } from "@repo/schemas";
import { cn } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { ListChecksIcon, LogInIcon } from "lucide-react";
import { headerButtonClass } from "@/components/header-styles";
import { Logo } from "@/components/Logo";
import { AppearanceMenu } from "@/features/appearance/AppearanceMenu";
import type { Appearance } from "@/features/appearance/appearance";
import { UserMenu } from "@/features/auth/UserMenu";
import { LanguageMenu } from "@/features/i18n/LanguageMenu";
import { m } from "@/paraglide/messages";
import { getLocale, setLocale } from "@/paraglide/runtime";

interface HeaderProps {
	appearance: Appearance;
	/** The signed-in user, null for a visitor. */
	me: Profile | null;
}

export function Header({ appearance, me }: HeaderProps) {
	return (
		<header className="border-inverse-border border-b bg-inverse text-inverse-foreground">
			<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
				<Logo />
				<div className="flex flex-wrap items-center gap-1">
					{/* The lists are reserved to signed-in users */}
					{me && (
						<Link
							to="/lists"
							aria-label={m.lists_title()}
							className={cn(
								headerButtonClass,
								"data-[status=active]:bg-inverse-foreground/10",
							)}
						>
							<ListChecksIcon aria-hidden className="size-5" />
						</Link>
					)}
					{/* Changing the language reloads the page in that language */}
					<LanguageMenu locale={getLocale()} onLocaleChange={setLocale} />
					<AppearanceMenu initialAppearance={appearance} />
					{me ? (
						<UserMenu me={me} />
					) : (
						<Link to="/sign-in" className={headerButtonClass}>
							<LogInIcon aria-hidden className="size-5" />
							{m.sign_in_link()}
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
