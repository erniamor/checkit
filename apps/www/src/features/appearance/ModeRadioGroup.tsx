import {
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@repo/ui";
import {
	type Appearance,
	parseAppearance,
} from "@/features/appearance/appearance";
import { appearanceOptions } from "@/features/appearance/appearance-options";
import { m } from "@/paraglide/messages";

interface ModeRadioGroupProps {
	value: Appearance;
	onValueChange: (appearance: Appearance) => void;
}

/** The light, dark and system modes in a dropdown menu. */
export function ModeRadioGroup({ value, onValueChange }: ModeRadioGroupProps) {
	return (
		<>
			<DropdownMenuLabel>{m.appearance_mode_label()}</DropdownMenuLabel>
			<DropdownMenuRadioGroup
				aria-label={m.appearance_mode_label()}
				value={value}
				onValueChange={(next) => onValueChange(parseAppearance(next))}
			>
				{appearanceOptions.map(({ value, label, Icon }) => (
					<DropdownMenuRadioItem key={value} value={value}>
						<Icon aria-hidden className="size-4" />
						{label()}
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</>
	);
}
