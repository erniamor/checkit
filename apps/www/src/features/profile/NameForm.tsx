import type { Profile } from "@repo/schemas";
import { Button } from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { getApi } from "@/lib/api";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface NameFormProps {
	/** The current name, empty at the first sign-in. */
	defaultName?: string;
	submitLabel: string;
	onSaved: (profile: Profile) => void | Promise<void>;
}

/** Sets the user's name, shown to the people lists are shared with. */
export function NameForm({ defaultName, submitLabel, onSaved }: NameFormProps) {
	const save = useMutation({
		mutationFn: (name: string) => getApi().me.update({ name }),
		onSuccess: onSaved,
	});
	const errors = save.error ? formErrors(save.error) : { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				save.mutate(
					String(new FormData(event.currentTarget).get("name") ?? ""),
				);
			}}
		>
			<TextField
				label={m.name_label()}
				name="name"
				autoComplete="name"
				defaultValue={defaultName}
				required
				error={errors.fields.name}
			/>
			<FormAlert message={errors.form} />
			<Button type="submit" disabled={save.isPending}>
				{submitLabel}
			</Button>
		</form>
	);
}
