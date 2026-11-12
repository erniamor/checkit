import type { UpdateItem } from "@repo/schemas";
import { buttonVariants } from "@repo/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";
import { useState } from "react";
import { FormAlert } from "@/components/FormAlert";
import { WithTooltip } from "@/components/WithTooltip";
import { AddItemForm } from "@/features/lists/AddItemForm";
import { CheckAllButtons } from "@/features/lists/CheckAllButtons";
import { DeleteListButton } from "@/features/lists/DeleteListButton";
import { ItemsSection } from "@/features/lists/ItemsSection";
import { ListTitle } from "@/features/lists/ListTitle";
import { canEdit, isOwner } from "@/features/lists/permissions";
import { itemsQueryOptions, listQueryOptions } from "@/features/lists/queries";
import { splitItems } from "@/features/lists/split-items";
import { useListMutations } from "@/features/lists/use-list-mutations";
import { saveErrorMessage } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

interface ListPageProps {
	listId: string;
}

/** The list and its items; kept up to date by `ListLive`, around it. */
export function ListPage({ listId }: ListPageProps) {
	const { data: list } = useSuspenseQuery(listQueryOptions(listId));
	const { data: page } = useSuspenseQuery(itemsQueryOptions(listId));
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
				<div className="flex flex-wrap items-center gap-1">
					<WithTooltip label={m.members_link()}>
						<Link
							to="/lists/$listId/members"
							params={{ listId }}
							aria-label={m.members_link()}
							className={buttonVariants({ variant: "ghost", size: "icon" })}
						>
							<UsersIcon aria-hidden className="size-4" />
						</Link>
					</WithTooltip>
					{isOwner(list.role) && (
						<DeleteListButton
							name={list.name}
							pending={mutations.deleteList.isPending}
							onConfirm={() => mutations.deleteList.mutate()}
						/>
					)}
				</div>
			</header>
			{!editable && (
				<p className="text-muted-foreground text-sm">{m.list_read_only()}</p>
			)}
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
					{editable && (
						<CheckAllButtons
							openCount={open.length}
							checkedCount={checked.length}
							onCheckAll={(done) => {
								setError(undefined);
								mutations.updateAllItems.mutate(done);
							}}
						/>
					)}
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
