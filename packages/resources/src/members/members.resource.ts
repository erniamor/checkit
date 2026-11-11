import {
	type Member,
	memberSchema,
	paginatedSchema,
	type UpdateMember,
	updateMemberSchema,
} from "@repo/schemas";
import {
	type Page,
	type PageOptions,
	segment,
	toPage,
	withQuery,
} from "../api/page";
import { type ApiClient, parseInput } from "../http/client";

/** The members of a list and their roles. */
export function createMembersResource(client: ApiClient) {
	const membersPath = (listId: string) => `/lists/${segment(listId)}/members`;

	return {
		/** The list's members, in joining order. */
		async list(
			listId: string,
			{ page, pageSize, signal }: PageOptions = {},
		): Promise<Page<Member>> {
			return toPage(
				await client.request({
					path: withQuery(membersPath(listId), { page, pageSize }),
					response: paginatedSchema(memberSchema),
					signal,
				}),
			);
		},

		/** Changes a member's role (owner only; the owner's role is fixed). */
		async updateRole(
			listId: string,
			userId: string,
			input: UpdateMember,
		): Promise<Member> {
			return client.request({
				method: "PATCH",
				path: `${membersPath(listId)}/${segment(userId)}`,
				body: parseInput(updateMemberSchema, input),
				response: memberSchema,
			});
		},

		/** Removes a member (owner only). */
		async remove(listId: string, userId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: `${membersPath(listId)}/${segment(userId)}`,
			});
		},

		/** The signed-in user leaves the list (not possible for the owner). */
		async leave(listId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: `${membersPath(listId)}/me`,
			});
		},
	};
}

export type MembersResource = ReturnType<typeof createMembersResource>;
