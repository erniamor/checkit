import { listKindSchema } from "@repo/schemas";
import { Button, buttonVariants } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { ListKindField } from "@/features/lists/ListKindField";
import { useCreateList } from "@/features/lists/use-create-list";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

/** Creates a list, then opens it (`NewListPage`). */
export function CreateListForm() {
	const createList = useCreateList();
	const errors = createList.error
		? formErrors(createList.error)
		: { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				createList.mutate({
					name: String(form.get("name") ?? ""),
					kind: listKindSchema.catch("purchases").parse(form.get("kind")),
				});
			}}
		>
			<TextField
				label={m.list_name_label()}
				name="name"
				placeholder={m.create_list_placeholder()}
				autoComplete="off"
				error={errors.fields.name}
			/>
			<ListKindField name="kind" />
			<FormAlert message={errors.form} />
			<div className="flex flex-wrap justify-end gap-2">
				<Link to="/lists" className={buttonVariants({ variant: "outline" })}>
					{m.cancel_button()}
				</Link>
				<Button type="submit" disabled={createList.isPending}>
					{m.create_list_button()}
				</Button>
			</div>
		</form>
	);
}
