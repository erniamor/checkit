import type { ListKind } from "@repo/schemas";
import { cn } from "@repo/ui";
import { IconButton } from "@/components/IconButton";
import { listKindIcons, listKindOptions } from "@/features/lists/list-kinds";
import { m } from "@/paraglide/messages";

interface ListKindSwitchProps {
	kind: ListKind;
	onChange: (kind: ListKind) => void;
}

/** Switches the list's kind with its icons, for editors and the owner. */
export function ListKindSwitch({ kind, onChange }: ListKindSwitchProps) {
	return (
		<fieldset
			aria-label={m.list_kind_label()}
			className="flex rounded-md border border-border p-0.5"
		>
			{listKindOptions().map((option) => {
				const selected = option.value === kind;
				return (
					<IconButton
						key={option.value}
						label={option.label}
						icon={listKindIcons[option.value]}
						variant={selected ? "secondary" : "ghost"}
						aria-pressed={selected}
						className={cn("size-8", !selected && "text-muted-foreground")}
						onClick={() => {
							if (!selected) {
								onChange(option.value);
							}
						}}
					/>
				);
			})}
		</fieldset>
	);
}
