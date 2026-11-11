import type { ConnectionState, Page } from "@repo/resources";
import type { Item, List } from "@repo/schemas";
import { toast } from "@repo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { applyListEvent } from "@/features/lists/apply-list-event";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";
import { m } from "@/paraglide/messages";

/**
 * Keeps the list's page up to date with the changes of the other members, and
 * leaves the page when the list is gone. Returns the connection state.
 */
export function useListEvents(listId: string, meId: string): ConnectionState {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [connection, setConnection] = useState<ConnectionState>("connecting");

	// Synchronizes with an external system (the API's stream): a legitimate effect
	useEffect(() => {
		const itemsKey = listKeys.items(listId);
		const listKey = listKeys.detail(listId);

		async function leave(reason: "deleted" | "access_lost") {
			const name = queryClient.getQueryData<List>(listKey)?.name ?? "";
			toast.info(
				reason === "deleted"
					? m.toast_list_deleted({ name })
					: m.toast_access_lost({ name }),
			);
			await navigate({ to: "/lists" });
			queryClient.removeQueries({ queryKey: listKey });
			await queryClient.invalidateQueries({ queryKey: listKeys.all });
		}

		const unsubscribe = getApi().lists.subscribe(listId, {
			onConnectionChange: setConnection,
			// Also after a reconnection: the events missed meanwhile aren't replayed
			onReady: () => {
				void queryClient.invalidateQueries({ queryKey: listKey });
			},
			onEvent: (event) => {
				const applied = applyListEvent(event, meId, {
					items: queryClient.getQueryData<Page<Item>>(itemsKey),
					list: queryClient.getQueryData<List>(listKey),
				});
				// A load in progress started before this change and would overwrite
				// the patch with older data: load again instead (the API saved the
				// change before publishing it)
				const loading = queryClient.isFetching({ queryKey: listKey }) > 0;
				if (loading && applied.outcome.kind === "patched") {
					void queryClient.invalidateQueries({ queryKey: listKey });
				} else {
					if (applied.items) {
						queryClient.setQueryData(itemsKey, applied.items);
					}
					if (applied.list) {
						queryClient.setQueryData(listKey, applied.list);
					}
				}
				switch (applied.outcome.kind) {
					case "reload":
						void queryClient.invalidateQueries({ queryKey: itemsKey });
						break;
					case "leave":
						void leave(applied.outcome.reason);
						return;
				}
				// The counts shown on "My lists" are stale now
				void queryClient.invalidateQueries({
					queryKey: listKeys.all,
					exact: true,
				});
			},
		});
		return unsubscribe;
	}, [listId, meId, queryClient, navigate]);

	return connection;
}
