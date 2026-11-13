import type { ListKind } from "@repo/schemas";
import { SelectField } from "@/components/SelectField";
import { listKindOptions } from "@/features/lists/list-kinds";
import { m } from "@/paraglide/messages";

interface ListKindSelectProps {
	kind: ListKind;
	onChange: (kind: ListKind) => void;
}

/** Changes the list's kind, for editors and the owner. */
export function ListKindSelect({ kind, onChange }: ListKindSelectProps) {
	return (
		<SelectField
			label={m.list_kind_label()}
			hideLabel
			tone="default"
			value={kind}
			options={listKindOptions()}
			onChange={onChange}
		/>
	);
}
