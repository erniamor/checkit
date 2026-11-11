import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui";
import { LanguagesIcon } from "lucide-react";
import { headerButtonClass } from "@/components/header-styles";
import { m } from "@/paraglide/messages";
import { isLocale, type Locale, locales } from "@/paraglide/runtime";

// Each language is named in itself, so anyone can find theirs whatever the
// current language: these names are the same in every locale
const localeNames: Record<Locale, string> = {
	en: "English",
	fr: "Français",
	es: "Español",
};

interface LanguageMenuProps {
	locale: Locale;
	onLocaleChange: (locale: Locale) => void;
}

/** The header's language menu: an icon and the current language's code. */
export function LanguageMenu({ locale, onLocaleChange }: LanguageMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={m.language_menu_label({ language: localeNames[locale] })}
					className={headerButtonClass}
				>
					<LanguagesIcon aria-hidden className="size-5" />
					<span aria-hidden className="font-medium uppercase">
						{locale}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{m.language_label()}</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={(value) => {
						if (isLocale(value) && value !== locale) {
							onLocaleChange(value);
						}
					}}
				>
					{locales.map((value) => (
						<DropdownMenuRadioItem key={value} value={value} lang={value}>
							{localeNames[value]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
