import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui";
import { type LucideIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import { headerButtonClass } from "@/components/header-styles";
import {
	type Appearance,
	applyAppearance,
	parseAppearance,
} from "@/features/appearance/appearance";
import { m } from "@/paraglide/messages";

const options: { value: Appearance; label: () => string; Icon: LucideIcon }[] =
	[
		{ value: "light", label: m.appearance_light, Icon: SunIcon },
		{ value: "dark", label: m.appearance_dark, Icon: MoonIcon },
		{ value: "system", label: m.appearance_system, Icon: MonitorIcon },
	];

interface AppearanceMenuProps {
	/** Appearance read from the cookie when the page was rendered. */
	initialAppearance: Appearance;
}

/** The header's appearance menu; its icon shows the current choice. */
export function AppearanceMenu({ initialAppearance }: AppearanceMenuProps) {
	const [appearance, setAppearance] = useState(initialAppearance);
	const current =
		options.find((option) => option.value === appearance) ?? options[2];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={m.appearance_menu_label({
						appearance: current?.label() ?? "",
					})}
					className={headerButtonClass}
				>
					{current && <current.Icon aria-hidden className="size-5" />}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{m.appearance_label()}</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={appearance}
					onValueChange={(value) => {
						const next = parseAppearance(value);
						setAppearance(next);
						applyAppearance(next);
					}}
				>
					{options.map(({ value, label, Icon }) => (
						<DropdownMenuRadioItem key={value} value={value}>
							<Icon aria-hidden className="size-4" />
							{label()}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
