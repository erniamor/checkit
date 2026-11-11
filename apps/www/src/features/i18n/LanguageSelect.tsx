import { SelectField } from "@/components/SelectField";
import { m } from "@/paraglide/messages";
import { type Locale, locales } from "@/paraglide/runtime";

// Each language is named in itself, so anyone can find theirs whatever the
// current language: these names are the same in every locale
const localeNames: Record<Locale, string> = {
	en: "English",
	fr: "Français",
	es: "Español",
};

interface LanguageSelectProps {
	locale: Locale;
	onLocaleChange: (locale: Locale) => void;
}

export function LanguageSelect({
	locale,
	onLocaleChange,
}: LanguageSelectProps) {
	return (
		<SelectField
			label={m.language_label()}
			hideLabel
			value={locale}
			options={locales.map((value) => ({ value, label: localeNames[value] }))}
			onChange={onLocaleChange}
		/>
	);
}
