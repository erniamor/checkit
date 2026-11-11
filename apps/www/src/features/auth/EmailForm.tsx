import { Button } from "@repo/ui";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface EmailFormProps {
	onSubmit: (email: string) => void;
	pending: boolean;
	error: unknown;
	/** Prefills the field, e.g. with the address an invitation was sent to. */
	defaultEmail?: string;
}

export function EmailForm({
	onSubmit,
	pending,
	error,
	defaultEmail,
}: EmailFormProps) {
	const errors = error ? formErrors(error) : { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit(String(new FormData(event.currentTarget).get("email") ?? ""));
			}}
		>
			<TextField
				label={m.email_label()}
				name="email"
				type="email"
				autoComplete="email"
				defaultValue={defaultEmail}
				required
				error={errors.fields.email}
			/>
			<FormAlert message={errors.form} />
			<Button type="submit" disabled={pending}>
				{m.send_link_button()}
			</Button>
		</form>
	);
}
