import type { CreateInvitation, ShareableRole } from "@repo/schemas";
import { Button } from "@repo/ui";
import { useState } from "react";
import { FormAlert } from "@/components/FormAlert";
import { SelectField } from "@/components/SelectField";
import { TextField } from "@/components/TextField";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface InviteFormProps {
	/** Resolves once the invitation is sent, rejects with the API's error. */
	onInvite: (input: CreateInvitation) => Promise<unknown>;
	pending: boolean;
	error: unknown;
}

export function InviteForm({ onInvite, pending, error }: InviteFormProps) {
	const [role, setRole] = useState<ShareableRole>("editor");
	const errors = error ? formErrors(error) : { fields: {} };

	return (
		<form
			noValidate
			className="grid gap-3"
			onSubmit={(event) => {
				event.preventDefault();
				const form = event.currentTarget;
				const email = String(new FormData(form).get("email") ?? "");
				onInvite({ email, role }).then(
					() => form.reset(),
					// Shown through `error`
					() => {},
				);
			}}
		>
			<TextField
				label={m.invite_email_label()}
				name="email"
				type="email"
				autoComplete="off"
				error={errors.fields.email}
			/>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<SelectField
					label={m.invite_role_label()}
					tone="default"
					value={role}
					options={[
						{ value: "editor", label: m.role_editor() },
						{ value: "viewer", label: m.role_viewer() },
					]}
					onChange={setRole}
				/>
				<Button type="submit" disabled={pending}>
					{m.invite_button()}
				</Button>
			</div>
			<FormAlert message={errors.form} />
		</form>
	);
}
