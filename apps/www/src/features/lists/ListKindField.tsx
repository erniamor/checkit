import type { ListKind } from "@repo/schemas";
import { useId } from "react";
import { listKindIcons, listKindOptions } from "@/features/lists/list-kinds";
import { m } from "@/paraglide/messages";

interface ListKindFieldProps {
	/** Name of the radio buttons in the form. */
	name: string;
	defaultValue?: ListKind;
}

/** Chooses a new list's kind: purchases or tasks. */
export function ListKindField({
	name,
	defaultValue = "purchases",
}: ListKindFieldProps) {
	const id = useId();

	return (
		<fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
			<legend className="sr-only">{m.list_kind_label()}</legend>
			{listKindOptions().map((option) => {
				const Icon = listKindIcons[option.value];
				return (
					<label
						key={option.value}
						htmlFor={`${id}-${option.value}`}
						className="flex cursor-pointer items-center gap-2 text-sm"
					>
						<input
							id={`${id}-${option.value}`}
							type="radio"
							name={name}
							value={option.value}
							defaultChecked={option.value === defaultValue}
							className="size-4 accent-primary"
						/>
						<Icon aria-hidden className="size-4 text-muted-foreground" />
						{option.label}
					</label>
				);
			})}
		</fieldset>
	);
}
