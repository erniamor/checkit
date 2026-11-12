import type { ItemStatus } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FormAlert } from "@/components/FormAlert";
import {
	emptyMessages,
	groupByList,
	matchesStatus,
} from "@/features/items/item-status";
import { ListItemsGroup } from "@/features/items/ListItemsGroup";
import { StatusFilter } from "@/features/items/StatusFilter";
import { useCheckItem } from "@/features/items/use-check-item";
import { allItemsQueryOptions } from "@/features/lists/queries";
import { saveErrorMessage } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface AllItemsPageProps {
	status: ItemStatus;
	onStatusChange: (status: ItemStatus) => void;
}

/** The items of all the user's lists, grouped by list and filtered by status. */
export function AllItemsPage({ status, onStatusChange }: AllItemsPageProps) {
	const { data: page } = useSuspenseQuery(allItemsQueryOptions(status));
	const [error, setError] = useState<string>();
	const checkItem = useCheckItem(status, (failure) =>
		setError(saveErrorMessage(failure)),
	);

	// An item checked from the "to do" view leaves it at once
	const groups = groupByList(
		page.items.filter((item) => matchesStatus(item, status)),
	);

	return (
		<section className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
			<h1 className="font-heading font-semibold text-2xl">{m.items_title()}</h1>
			<StatusFilter
				status={status}
				onStatusChange={(next) => {
					setError(undefined);
					onStatusChange(next);
				}}
			/>
			<FormAlert message={error} />
			{groups.length === 0 ? (
				<p className="text-muted-foreground">{emptyMessages[status]()}</p>
			) : (
				<div className="grid gap-6">
					{groups.map((group) => (
						<ListItemsGroup
							key={group.list.id}
							group={group}
							onCheckedChange={(item, done) => {
								setError(undefined);
								checkItem.mutate({ item, done });
							}}
						/>
					))}
				</div>
			)}
			{page.total > page.items.length && (
				<p className="text-muted-foreground text-sm">
					{m.all_items_truncated({
						shown: String(page.items.length),
						total: String(page.total),
					})}
				</p>
			)}
		</section>
	);
}
