import { listKindSchema } from "@repo/schemas";
import { Button } from "@repo/ui";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { ListKindField } from "@/features/lists/ListKindField";
import { useCreateList } from "@/features/lists/use-create-list";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

export function CreateListForm() {
	const createList = useCreateList();
	const errors = createList.error
		? formErrors(createList.error)
		: { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				createList.mutate({
					name: String(form.get("name") ?? ""),
					kind: listKindSchema.catch("purchases").parse(form.get("kind")),
				});
			}}
		>
			<div className="flex items-start gap-2">
				<div className="flex-1">
					<TextField
						label={m.create_list_label()}
						name="name"
						placeholder={m.create_list_placeholder()}
						autoComplete="off"
						error={errors.fields.name}
					/>
				</div>
				<Button type="submit" className="mt-6" disabled={createList.isPending}>
					{m.create_list_button()}
				</Button>
			</div>
			<ListKindField name="kind" />
			<FormAlert message={errors.form} />
		</form>
	);
}
