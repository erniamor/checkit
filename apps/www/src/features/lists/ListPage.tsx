import type { UpdateItem } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { FormAlert } from "@/components/FormAlert";
import { AddItemForm } from "@/features/lists/AddItemForm";
import { ConnectionStatus } from "@/features/lists/ConnectionStatus";
import { DeleteListButton } from "@/features/lists/DeleteListButton";
import { ItemsSection } from "@/features/lists/ItemsSection";
import { ListTitle } from "@/features/lists/ListTitle";
import { canEdit, isOwner } from "@/features/lists/permissions";
import { itemsQueryOptions, listQueryOptions } from "@/features/lists/queries";
import { splitItems } from "@/features/lists/split-items";
import { useListEvents } from "@/features/lists/use-list-events";
import { useListMutations } from "@/features/lists/use-list-mutations";
import { saveErrorMessage } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface ListPageProps {
	listId: string;
	/** The signed-in user, to tell their own changes from the others'. */
	meId: string;
}

export function ListPage({ listId, meId }: ListPageProps) {
	const { data: list } = useSuspenseQuery(listQueryOptions(listId));
	const { data: page } = useSuspenseQuery(itemsQueryOptions(listId));
	const connection = useListEvents(listId, meId);
	const [error, setError] = useState<string>();
	const mutations = useListMutations(listId, (failure) =>
		setError(saveErrorMessage(failure)),
	);

	const editable = canEdit(list.role);
	const { open, checked } = splitItems(page.items);
	const updateItem = (itemId: string, changes: UpdateItem) => {
		setError(undefined);
		mutations.updateItem.mutate({ itemId, changes });
	};
	const deleteItem = (itemId: string) => {
		setError(undefined);
		mutations.deleteItem.mutate(itemId);
	};

	return (
		<section className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
			<Link
				to="/lists"
				className="text-muted-foreground text-sm underline-offset-4 hover:underline"
			>
				← {m.back_to_lists()}
			</Link>
			<header className="flex flex-wrap items-start justify-between gap-2">
				<ListTitle
					name={list.name}
					editable={editable}
					onRename={(name) => {
						setError(undefined);
						mutations.renameList.mutate(name);
					}}
				/>
				{isOwner(list.role) && (
					<DeleteListButton
						name={list.name}
						pending={mutations.deleteList.isPending}
						onConfirm={() => mutations.deleteList.mutate()}
					/>
				)}
			</header>
			{!editable && (
				<p className="text-muted-foreground text-sm">{m.list_read_only()}</p>
			)}
			<ConnectionStatus state={connection} />
			<FormAlert message={error} />
			{editable && (
				<AddItemForm
					onAdd={(label) => {
						setError(undefined);
						mutations.addItem.mutate(label);
					}}
				/>
			)}
			{page.items.length === 0 ? (
				<p className="text-muted-foreground">
					{editable ? m.items_empty_editor() : m.items_empty()}
				</p>
			) : (
				<div className="grid gap-6">
					<ItemsSection
						items={open}
						editable={editable}
						onUpdate={updateItem}
						onDelete={deleteItem}
					/>
					<ItemsSection
						title={m.checked_section()}
						items={checked}
						editable={editable}
						onUpdate={updateItem}
						onDelete={deleteItem}
					/>
				</div>
			)}
		</section>
	);
}
