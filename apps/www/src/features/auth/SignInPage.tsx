import { CheckEmail } from "@/features/auth/CheckEmail";
import { CodeForm } from "@/features/auth/CodeForm";
import { EmailForm } from "@/features/auth/EmailForm";
import { useSignIn } from "@/features/auth/use-sign-in";
import { useIsIosApp } from "@/features/pwa/use-is-ios-app";
import { m } from "@/paraglide/messages";

interface SignInPageProps {
	redirect: string;
	onSignedIn: () => void | Promise<void>;
	/** Prefills the email field. */
	defaultEmail?: string;
}

export function SignInPage({
	redirect,
	onSignedIn,
	defaultEmail,
}: SignInPageProps) {
	const codeOnly = useIsIosApp();
	const { step, sendEmail, sendCode, signIn, restart } = useSignIn({
		redirect,
		onSignedIn,
		codeOnly,
	});

	return (
		<section className="mx-auto grid max-w-md gap-6 px-4 py-12">
			<header className="grid gap-2">
				<h1 className="font-heading font-semibold text-2xl">
					{m.sign_in_title()}
				</h1>
				{step.kind === "email" && (
					<p className="text-muted-foreground">
						{codeOnly ? m.sign_in_intro_code() : m.sign_in_intro()}
					</p>
				)}
			</header>
			{step.kind === "email" && (
				<EmailForm
					onSubmit={(email) => sendEmail.mutate(email)}
					sends={codeOnly ? "code" : "link"}
					pending={sendEmail.isPending}
					error={sendEmail.error}
					defaultEmail={defaultEmail}
				/>
			)}
			{step.kind === "check-email" && (
				<CheckEmail
					email={step.email}
					onUseCode={() => sendCode.mutate(step.email)}
					onRestart={restart}
					pending={sendCode.isPending}
					error={sendCode.error}
				/>
			)}
			{step.kind === "code" && (
				<CodeForm
					email={step.email}
					onSubmit={(code) => signIn.mutate({ email: step.email, code })}
					onRestart={restart}
					pending={signIn.isPending}
					error={signIn.error}
				/>
			)}
		</section>
	);
}
