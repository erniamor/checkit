import { Logo } from "@/components/Logo";
import { AppearanceSelect } from "@/features/appearance/AppearanceSelect";
import type { Appearance } from "@/features/appearance/appearance";
import { LanguageSelect } from "@/features/i18n/LanguageSelect";
import { getLocale, setLocale } from "@/paraglide/runtime";

interface HeaderProps {
	appearance: Appearance;
}

export function Header({ appearance }: HeaderProps) {
	return (
		<header className="border-inverse-border border-b bg-inverse text-inverse-foreground">
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
				<Logo />
				<div className="flex items-center gap-2">
					{/* Changing the language reloads the page in that language */}
					<LanguageSelect locale={getLocale()} onLocaleChange={setLocale} />
					<AppearanceSelect initialAppearance={appearance} />
				</div>
			</div>
		</header>
	);
}
