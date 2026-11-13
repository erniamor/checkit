import type { ListKind } from "@repo/schemas";
import { cn } from "@repo/ui";
import { listKindIcons, listKindLabels } from "@/features/lists/list-kinds";

interface ListKindIconProps {
	kind: ListKind;
	className?: string;
}

/** The list's kind as an icon, named for screen readers. */
export function ListKindIcon({ kind, className }: ListKindIconProps) {
	const Icon = listKindIcons[kind];
	return (
		<>
			<Icon
				aria-hidden
				className={cn("size-4 shrink-0 text-muted-foreground", className)}
			/>
			<span className="sr-only">{listKindLabels[kind]()}</span>
			{/* Keeps the label apart from the text that follows, when read */}{" "}
		</>
	);
}
