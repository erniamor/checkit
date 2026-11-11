import { Button } from "@repo/ui";
import { useState } from "react";
import { TextField } from "@/components/TextField";
import { m } from "@/paraglide/messages";

interface InlineEditFormProps {
	label: string;
	defaultValue: string;
	/** Returns an error message to show, or nothing when the value is saved. */
	onSave: (value: string) => string | undefined;
	onCancel: () => void;
}

/** Edits a text in place: Enter saves, Escape cancels. */
export function InlineEditForm({
	label,
	defaultValue,
	onSave,
	onCancel,
}: InlineEditFormProps) {
	const [error, setError] = useState<string>();

	return (
		<form
			noValidate
			className="flex flex-1 flex-wrap items-start gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				setError(
					onSave(String(new FormData(event.currentTarget).get("value") ?? "")),
				);
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					onCancel();
				}
			}}
		>
			<div className="min-w-48 flex-1">
				<TextField
					label={label}
					name="value"
					defaultValue={defaultValue}
					// The user just asked to edit this field
					autoFocus
					error={error}
				/>
			</div>
			<div className="flex gap-2 self-end">
				<Button type="submit" size="sm">
					{m.save_button()}
				</Button>
				<Button type="button" size="sm" variant="ghost" onClick={onCancel}>
					{m.cancel_button()}
				</Button>
			</div>
		</form>
	);
}
