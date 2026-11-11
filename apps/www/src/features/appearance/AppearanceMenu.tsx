import type { ThemeName } from "@repo/themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { useState } from "react";
import { headerButtonClass } from "@/components/header-styles";
import {
	type Appearance,
	applyAppearance,
} from "@/features/appearance/appearance";
import { getAppearanceOption } from "@/features/appearance/appearance-options";
import { ModeRadioGroup } from "@/features/appearance/ModeRadioGroup";
import { ThemeRadioGroup } from "@/features/theme/ThemeRadioGroup";
import { applyTheme, themeLabels } from "@/features/theme/theme";
import { m } from "@/paraglide/messages";

interface AppearanceMenuProps {
	/** Appearance read from the cookie when the page was rendered. */
	initialAppearance: Appearance;
	/** Theme read from the cookie when the page was rendered. */
	initialTheme: ThemeName;
}

/** The header's appearance menu (mode and theme); its icon shows the current mode. */
export function AppearanceMenu({
	initialAppearance,
	initialTheme,
}: AppearanceMenuProps) {
	const [appearance, setAppearance] = useState(initialAppearance);
	const [theme, setTheme] = useState(initialTheme);
	const current = getAppearanceOption(appearance);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={m.appearance_menu_label({
						appearance: current.label(),
						theme: themeLabels[theme](),
					})}
					className={headerButtonClass}
				>
					<current.Icon aria-hidden className="size-5" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<ModeRadioGroup
					value={appearance}
					onValueChange={(next) => {
						setAppearance(next);
						applyAppearance(next);
					}}
				/>
				<DropdownMenuSeparator />
				<ThemeRadioGroup
					value={theme}
					onValueChange={(next) => {
						setTheme(next);
						applyTheme(next);
					}}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
