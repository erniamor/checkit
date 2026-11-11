import { cn } from "@repo/ui";
import { useId } from "react";

export interface SelectOption<Value extends string> {
	value: Value;
	label: string;
}

interface SelectFieldProps<Value extends string> {
	label: string;
	value: Value;
	options: readonly SelectOption<Value>[];
	onChange: (value: Value) => void;
	/** Hides the label visually; it stays available to screen readers. */
	hideLabel?: boolean;
	/** "inverse" on the header's dark band, "default" on the pages. */
	tone?: "inverse" | "default";
	disabled?: boolean;
	className?: string;
}

const toneClasses = {
	inverse: "border-inverse-border bg-inverse text-inverse-foreground",
	default: "border-input bg-background text-foreground",
};

/** A native select with its label: keyboard and screen reader support for free. */
export function SelectField<Value extends string>({
	label,
	value,
	options,
	onChange,
	hideLabel = false,
	tone = "inverse",
	disabled = false,
	className,
}: SelectFieldProps<Value>) {
	const id = useId();

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<label htmlFor={id} className={cn("text-sm", hideLabel && "sr-only")}>
				{label}
			</label>
			<select
				id={id}
				value={value}
				disabled={disabled}
				onChange={(event) => {
					const option = options.find(
						(candidate) => candidate.value === event.target.value,
					);
					if (option) {
						onChange(option.value);
					}
				}}
				className={cn(
					"h-9 cursor-pointer rounded-md border px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					toneClasses[tone],
				)}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
