import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import type { ReactElement } from "react";

interface WithTooltipProps {
	label: string;
	/** A single focusable element: button, link... */
	children: ReactElement;
}

/**
 * Shows `label` in a tooltip on hover and keyboard focus. Icon-only controls
 * still need their own accessible name (`aria-label`): tooltips don't show on
 * touch screens.
 */
export function WithTooltip({ label, children }: WithTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
