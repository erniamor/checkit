import { itemLabelSchema } from "@repo/schemas";
import { Button } from "@repo/ui";
import { useState } from "react";
import { TextField } from "@/components/TextField";
import { validateField } from "@/lib/validate-field";
import { m } from "@/paraglide/messages";

interface AddItemFormProps {
	/** Returns an error message to show, or nothing when the item is added. */
	onAdd: (label: string) => string | undefined;
}

/** Adds an item; the field empties and keeps the focus to add the next one. */
export function AddItemForm({ onAdd }: AddItemFormProps) {
	const [error, setError] = useState<string>();

	return (
		<form
			noValidate
			className="flex items-start gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				const form = event.currentTarget;
				const result = validateField(
					itemLabelSchema,
					new FormData(form).get("label") ?? "",
				);
				if (!result.ok) {
					setError(result.error);
					return;
				}
				const refusal = onAdd(result.value);
				setError(refusal);
				if (!refusal) {
					form.reset();
				}
			}}
		>
			<div className="flex-1">
				<TextField
					label={m.add_item_label()}
					name="label"
					autoComplete="off"
					error={error}
				/>
			</div>
			<Button type="submit" className="mt-6">
				{m.add_item_button()}
			</Button>
		</form>
	);
}
