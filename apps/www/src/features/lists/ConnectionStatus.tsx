import type { ConnectionState } from "@repo/resources";
import { m } from "@/paraglide/messages";

interface ConnectionStatusProps {
	state: ConnectionState;
}

/** Says when the live updates are interrupted; shows nothing while they work. */
export function ConnectionStatus({ state }: ConnectionStatusProps) {
	const message =
		state === "reconnecting"
			? m.connection_reconnecting()
			: state === "closed"
				? m.connection_closed()
				: undefined;

	// The live region always exists, so screen readers announce the message
	// when it appears
	return (
		<p role="status" className="text-muted-foreground text-sm empty:hidden">
			{message}
		</p>
	);
}
