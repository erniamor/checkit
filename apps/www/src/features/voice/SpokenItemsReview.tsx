import type { Item } from "@repo/schemas";
import { Button } from "@repo/ui";
import { useState } from "react";
import { FormAlert } from "@/components/FormAlert";
import {
	checkSpokenItems,
	spokenItemHint,
} from "@/features/voice/review-spoken-items";
import { SpokenItemRow } from "@/features/voice/SpokenItemRow";
import { m } from "@/paraglide/messages";

interface SpokenItemsReviewProps {
	/** The sentence heard. */
	text: string;
	/** The items found in it. */
	labels: string[];
	/** The list's items, to say which labels it already has. */
	items: readonly Item[];
	onAdd: (labels: string[]) => void;
	onRetry: () => void;
}

interface Row {
	key: number;
	label: string;
}

/** The recognized items, corrected or removed by the user, then added. */
export function SpokenItemsReview({
	text,
	labels,
	items,
	onAdd,
	onRetry,
}: SpokenItemsReviewProps) {
	const [rows, setRows] = useState<Row[]>(() =>
		labels.map((label, key) => ({ key, label })),
	);
	const [errors, setErrors] = useState<(string | undefined)[]>([]);
	const [formError, setFormError] = useState<string>();

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				const check = checkSpokenItems(rows.map((row) => row.label));
				if (check.ok) {
					onAdd(check.labels);
					return;
				}
				setErrors(check.fields);
				setFormError(check.form);
			}}
		>
			<p className="text-muted-foreground text-sm">{m.voice_heard({ text })}</p>
			<FormAlert message={formError} />
			<ul className="grid gap-3">
				{rows.map((row, index) => (
					<SpokenItemRow
						key={row.key}
						number={index + 1}
						label={row.label}
						hint={spokenItemHint(items, row.label)}
						error={errors[index]}
						onChange={(label) =>
							setRows((current) =>
								current.map((other) =>
									other.key === row.key ? { ...other, label } : other,
								),
							)
						}
						onRemove={() => {
							setRows((current) =>
								current.filter((other) => other.key !== row.key),
							);
							setErrors([]);
						}}
					/>
				))}
			</ul>
			<div className="flex flex-wrap justify-end gap-2">
				<Button type="button" variant="outline" onClick={onRetry}>
					{m.voice_retry()}
				</Button>
				<Button type="submit">{m.voice_add_button()}</Button>
			</div>
		</form>
	);
}
