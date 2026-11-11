import { Button } from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { FormAlert } from "@/components/FormAlert";
import { TextField } from "@/components/TextField";
import { getApi } from "@/lib/api";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface WelcomePageProps {
	onSaved: () => void | Promise<void>;
}

/** First sign-in: asks for the name shown to the people lists are shared with. */
export function WelcomePage({ onSaved }: WelcomePageProps) {
	const save = useMutation({
		mutationFn: (name: string) => getApi().me.update({ name }),
		onSuccess: onSaved,
	});
	const errors = save.error ? formErrors(save.error) : { fields: {} };

	return (
		<section className="mx-auto grid max-w-md gap-6 px-4 py-12">
			<header className="grid gap-2">
				<h1 className="font-heading font-semibold text-2xl">
					{m.welcome_title()}
				</h1>
				<p className="text-muted-foreground">{m.welcome_intro()}</p>
			</header>
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
					required
					error={errors.fields.name}
				/>
				<FormAlert message={errors.form} />
				<Button type="submit" disabled={save.isPending}>
					{m.save_name_button()}
				</Button>
			</form>
		</section>
	);
}
