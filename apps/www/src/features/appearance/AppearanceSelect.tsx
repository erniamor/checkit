import { useState } from "react";
import { SelectField } from "@/components/SelectField";
import {
	type Appearance,
	applyAppearance,
} from "@/features/appearance/appearance";
import { m } from "@/paraglide/messages";

interface AppearanceSelectProps {
	/** Appearance read from the cookie when the page was rendered. */
	initialAppearance: Appearance;
}

export function AppearanceSelect({ initialAppearance }: AppearanceSelectProps) {
	const [appearance, setAppearance] = useState(initialAppearance);

	return (
		<SelectField
			label={m.appearance_label()}
			hideLabel
			value={appearance}
			options={[
				{ value: "light", label: m.appearance_light() },
				{ value: "dark", label: m.appearance_dark() },
				{ value: "system", label: m.appearance_system() },
			]}
			onChange={(value) => {
				setAppearance(value);
				applyAppearance(value);
			}}
		/>
	);
}
