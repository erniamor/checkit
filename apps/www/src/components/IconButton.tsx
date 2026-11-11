import { Button } from "@repo/ui";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { WithTooltip } from "@/components/WithTooltip";

interface IconButtonProps
	extends Omit<ComponentProps<typeof Button>, "children" | "size"> {
	/** Accessible name, e.g. "Rename “Milk”". */
	label: string;
	icon: LucideIcon;
	/** Shorter text for the tooltip, e.g. "Rename"; defaults to `label`. */
	tooltip?: string;
}

/** A button showing only an icon, named for screen readers and with a tooltip. */
export function IconButton({
	label,
	icon: Icon,
	tooltip,
	variant = "ghost",
	...props
}: IconButtonProps) {
	return (
		<WithTooltip label={tooltip ?? label}>
			<Button
				type="button"
				variant={variant}
				size="icon"
				aria-label={label}
				{...props}
			>
				<Icon aria-hidden className="size-4" />
			</Button>
		</WithTooltip>
	);
}
