import { listNameSchema } from "@repo/schemas";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/IconButton";
import { InlineEditForm } from "@/components/InlineEditForm";
import { validateField } from "@/lib/validate-field";
import { m } from "@/paraglide/messages";

interface ListTitleProps {
	name: string;
	editable: boolean;
	onRename: (name: string) => void;
}

/** The list's name, renamed in place by editors and the owner. */
export function ListTitle({ name, editable, onRename }: ListTitleProps) {
	const [editing, setEditing] = useState(false);

	if (editing) {
		return (
			<InlineEditForm
				label={m.list_name_label()}
				defaultValue={name}
				onCancel={() => setEditing(false)}
				onSave={(value) => {
					const result = validateField(listNameSchema, value);
					if (!result.ok) {
						return result.error;
					}
					if (result.value !== name) {
						onRename(result.value);
					}
					setEditing(false);
					return undefined;
				}}
			/>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<h1 className="break-words font-heading font-semibold text-2xl">
				{name}
			</h1>
			{editable && (
				<IconButton
					icon={PencilIcon}
					label={m.rename_list_button()}
					onClick={() => setEditing(true)}
				/>
			)}
		</div>
	);
}
