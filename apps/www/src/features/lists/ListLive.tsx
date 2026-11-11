import type { ReactNode } from "react";
import { ConnectionStatus } from "@/features/lists/ConnectionStatus";
import { useListEvents } from "@/features/lists/use-list-events";

interface ListLiveProps {
	listId: string;
	/** The signed-in user, to tell their own changes from the others'. */
	meId: string;
	children: ReactNode;
}

/**
 * Keeps the pages of a list (items, members) up to date in real time, and says
 * when the live updates are interrupted.
 */
export function ListLive({ listId, meId, children }: ListLiveProps) {
	const connection = useListEvents(listId, meId);

	return (
		<>
			<div className="mx-auto max-w-2xl px-4 pt-4 empty:hidden">
				<ConnectionStatus state={connection} />
			</div>
			{children}
		</>
	);
}
