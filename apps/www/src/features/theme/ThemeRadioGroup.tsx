import { isThemeName, type ThemeName, themes } from "@repo/themes";
import {
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@repo/ui";
import { themeLabels } from "@/features/theme/theme";
import { m } from "@/paraglide/messages";

interface ThemeRadioGroupProps {
	value: ThemeName;
	onValueChange: (theme: ThemeName) => void;
}

/** The themes offered in a dropdown menu. */
export function ThemeRadioGroup({
	value,
	onValueChange,
}: ThemeRadioGroupProps) {
	return (
		<>
			<DropdownMenuLabel>{m.theme_label()}</DropdownMenuLabel>
			<DropdownMenuRadioGroup
				aria-label={m.theme_label()}
				value={value}
				onValueChange={(next) => {
					if (isThemeName(next)) onValueChange(next);
				}}
			>
				{themes.map((name) => (
					<DropdownMenuRadioItem key={name} value={name}>
						{themeLabels[name]()}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</>
	);
}
