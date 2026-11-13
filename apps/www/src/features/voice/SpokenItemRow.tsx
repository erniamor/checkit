import { XIcon } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";
import { m } from "@/paraglide/messages";

interface SpokenItemRowProps {
	/** Position in the review, from 1, for the field's label. */
	number: number;
	label: string;
	/** What adding it will do, when it's already in the list. */
	hint?: string;
	error?: string;
	onChange: (label: string) => void;
	onRemove: () => void;
}

/** One recognized item, to correct or remove before adding it. */
export function SpokenItemRow({
	number,
	label,
	hint,
	error,
	onChange,
	onRemove,
}: SpokenItemRowProps) {
	return (
		<li className="grid gap-1">
			<div className="flex items-end gap-2">
				<div className="flex-1">
					<TextField
						label={m.voice_item_label({ number })}
						value={label}
						autoComplete="off"
						error={error}
						onChange={(event) => onChange(event.target.value)}
					/>
				</div>
				<IconButton
					label={m.voice_remove_item({ label })}
					tooltip={m.voice_remove()}
					icon={XIcon}
					onClick={onRemove}
				/>
			</div>
			{hint && <p className="text-muted-foreground text-sm">{hint}</p>}
		</li>
	);
}
