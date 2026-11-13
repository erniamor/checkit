import { createAuthResource } from "./auth/auth.resource";
import { type ApiClientConfig, createApiClient } from "./http/client";
import { createInvitationsResource } from "./invitations/invitations.resource";
import { createItemsResource } from "./items/items.resource";
import { createListsResource } from "./lists/lists.resource";
import { createMeResource } from "./me/me.resource";
import { createMembersResource } from "./members/members.resource";
import { createShareLinksResource } from "./share-links/share-links.resource";
import { createTranscriptionsResource } from "./transcriptions/transcriptions.resource";

export type { Page, PageOptions } from "./api/page";
export type { AuthResource } from "./auth/auth.resource";
export {
	ApiError,
	ForbiddenError,
	NetworkError,
	NotFoundError,
	RateLimitError,
	ServerError,
	UnauthorizedError,
	ValidationError,
} from "./errors";
export type { ApiClientConfig } from "./http/client";
export type { InvitationsResource } from "./invitations/invitations.resource";
export type { ItemsResource } from "./items/items.resource";
export type {
	ConnectionState,
	ListEventHandlers,
} from "./lists/list-events";
export type { ListsResource } from "./lists/lists.resource";
export type { MeResource } from "./me/me.resource";
export type { MembersResource } from "./members/members.resource";
export type { ShareLinksResource } from "./share-links/share-links.resource";
export type { TranscriptionsResource } from "./transcriptions/transcriptions.resource";

/** The API's resources, sharing one configuration. */
export function createApi(config: ApiClientConfig) {
	const client = createApiClient(config);
	return {
		auth: createAuthResource(client),
		me: createMeResource(client),
		lists: createListsResource(client),
		items: createItemsResource(client),
		members: createMembersResource(client),
		invitations: createInvitationsResource(client),
		shareLinks: createShareLinksResource(client),
		transcriptions: createTranscriptionsResource(client),
	};
}

export type Api = ReturnType<typeof createApi>;
