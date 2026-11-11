import { createAuthResource } from "./auth/auth.resource";
import { type ApiClientConfig, createApiClient } from "./http/client";
import { createItemsResource } from "./items/items.resource";
import { createListsResource } from "./lists/lists.resource";
import { createMeResource } from "./me/me.resource";

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
export type { ItemsResource } from "./items/items.resource";
export type { ListsResource } from "./lists/lists.resource";
export type { MeResource } from "./me/me.resource";

/** The API's resources, sharing one configuration. */
export function createApi(config: ApiClientConfig) {
	const client = createApiClient(config);
	return {
		auth: createAuthResource(client),
		me: createMeResource(client),
		lists: createListsResource(client),
		items: createItemsResource(client),
	};
}

export type Api = ReturnType<typeof createApi>;
