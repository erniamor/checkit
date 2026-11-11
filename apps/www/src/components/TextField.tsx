import { Input, Label } from "@repo/ui";
import { type ComponentProps, useId } from "react";

interface TextFieldProps extends ComponentProps<"input"> {
	label: string;
	/** Error shown under the field and announced with it. */
	error?: string;
}

/** A labelled input with its error message. */
export function TextField({ label, error, id, ...props }: TextFieldProps) {
	const generatedId = useId();
	const fieldId = id ?? generatedId;
	const errorId = `${fieldId}-error`;

	return (
		<div className="grid gap-2">
			<Label htmlFor={fieldId}>{label}</Label>
			<Input
				id={fieldId}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				{...props}
			/>
			{error && (
				<p id={errorId} className="text-destructive text-sm">
					{error}
				</p>
			)}
		</div>
	);
}
