import { Button } from "@repo/ui";
import { FormAlert } from "@/components/FormAlert";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface CheckEmailProps {
	email: string;
	onUseCode: () => void;
	onRestart: () => void;
	pending: boolean;
	error: unknown;
}

/** After the magic link is sent, with the code as a fallback. */
export function CheckEmail({
	email,
	onUseCode,
	onRestart,
	pending,
	error,
}: CheckEmailProps) {
	return (
		<div className="grid gap-4">
			<h2 className="font-heading font-semibold text-xl">
				{m.check_email_title()}
			</h2>
			<p className="text-muted-foreground">{m.check_email_text({ email })}</p>
			<FormAlert message={error ? formErrors(error).form : undefined} />
			<div className="flex flex-wrap gap-2">
				<Button type="button" onClick={onUseCode} disabled={pending}>
					{m.use_code_button()}
				</Button>
				<Button type="button" variant="ghost" onClick={onRestart}>
					{m.use_other_email_button()}
				</Button>
			</div>
		</div>
	);
}
