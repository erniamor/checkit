import { SIGN_IN_CODE_LENGTH } from "@repo/schemas";
import { Button } from "@repo/ui";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface CodeFormProps {
	email: string;
	onSubmit: (code: string) => void;
	onRestart: () => void;
	pending: boolean;
	error: unknown;
}

export function CodeForm({
	email,
	onSubmit,
	onRestart,
	pending,
	error,
}: CodeFormProps) {
	const errors = error ? formErrors(error) : { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit(String(new FormData(event.currentTarget).get("code") ?? ""));
			}}
		>
			<h2 className="font-heading font-semibold text-xl">{m.code_title()}</h2>
			<p className="text-muted-foreground">{m.code_text({ email })}</p>
			<TextField
				label={m.code_label()}
				name="code"
				inputMode="numeric"
				autoComplete="one-time-code"
				maxLength={SIGN_IN_CODE_LENGTH}
				required
				error={errors.fields.code}
			/>
			<FormAlert message={errors.form} />
			<div className="flex flex-wrap gap-2">
				<Button type="submit" disabled={pending}>
					{m.sign_in_button()}
				</Button>
				<Button type="button" variant="ghost" onClick={onRestart}>
					{m.use_other_email_button()}
				</Button>
			</div>
		</form>
	);
}
