interface FormAlertProps {
	message?: string;
}

/** An error about the whole form, announced by screen readers when it appears. */
export function FormAlert({ message }: FormAlertProps) {
	if (!message) {
		return null;
	}
	return (
		<p role="alert" className="text-destructive text-sm">
			{message}
		</p>
	);
}
