import { NameForm } from "@/features/profile/NameForm";
import { m } from "@/paraglide/messages";

interface WelcomePageProps {
	onSaved: () => void | Promise<void>;
}

/** First sign-in: asks for the name shown to the people lists are shared with. */
export function WelcomePage({ onSaved }: WelcomePageProps) {
	return (
		<section className="mx-auto grid max-w-md gap-6 px-4 py-12">
			<header className="grid gap-2">
				<h1 className="font-heading font-semibold text-2xl">
					{m.welcome_title()}
				</h1>
				<p className="text-muted-foreground">{m.welcome_intro()}</p>
			</header>
			<NameForm submitLabel={m.save_name_button()} onSaved={onSaved} />
		</section>
	);
}
