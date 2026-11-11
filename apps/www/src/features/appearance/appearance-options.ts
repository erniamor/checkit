import { type LucideIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import type { Appearance } from "@/features/appearance/appearance";
import { m } from "@/paraglide/messages";

export interface AppearanceOption {
	value: Appearance;
	label: () => string;
	Icon: LucideIcon;
}

const systemOption: AppearanceOption = {
	value: "system",
	label: m.appearance_system,
	Icon: MonitorIcon,
};

export const appearanceOptions: AppearanceOption[] = [
	{ value: "light", label: m.appearance_light, Icon: SunIcon },
	{ value: "dark", label: m.appearance_dark, Icon: MoonIcon },
	systemOption,
];

export function getAppearanceOption(appearance: Appearance): AppearanceOption {
	return (
		appearanceOptions.find((option) => option.value === appearance) ??
		systemOption
	);
}
