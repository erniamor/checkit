import { isThemeName, type ThemeName, themes } from "@repo/themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui";
import { PaletteIcon } from "lucide-react";
import { useState } from "react";
import { headerButtonClass } from "@/components/header-styles";
import { applyTheme } from "@/features/theme/theme";
import { m } from "@/paraglide/messages";

const themeLabels: Record<ThemeName, () => string> = {
	brand: m.theme_brand,
	neutral: m.theme_neutral,
	"variant-a": m.theme_variant_a,
	"variant-b": m.theme_variant_b,
	"variant-c": m.theme_variant_c,
	"variant-d": m.theme_variant_d,
	"variant-e": m.theme_variant_e,
};

interface ThemeMenuProps {
	/** Theme read from the cookie when the page was rendered. */
	initialTheme: ThemeName;
}

/** Previews the theme variants (development only): applied at once, kept in a cookie. */
export function ThemeMenu({ initialTheme }: ThemeMenuProps) {
	const [theme, setTheme] = useState(initialTheme);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={m.theme_menu_label({ theme: themeLabels[theme]() })}
					className={headerButtonClass}
				>
					<PaletteIcon aria-hidden className="size-5" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{m.theme_label()}</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => {
						if (isThemeName(value)) {
							setTheme(value);
							applyTheme(value);
						}
					}}
				>
					{themes.map((name) => (
						<DropdownMenuRadioItem key={name} value={name}>
							{themeLabels[name]()}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
