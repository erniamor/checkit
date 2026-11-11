import {
	type Profile,
	profileSchema,
	type UpdateProfile,
	updateProfileSchema,
} from "@repo/schemas";
import { type ApiClient, parseInput } from "../http/client";

/** The signed-in user's profile. */
export function createMeResource(client: ApiClient) {
	return {
		/** Throws an UnauthorizedError without a valid session. */
		async get(options: { signal?: AbortSignal } = {}): Promise<Profile> {
			return client.request({
				path: "/me",
				response: profileSchema,
				signal: options.signal,
			});
		},

		// async: an invalid input rejects the promise, it doesn't throw synchronously
		async update(input: UpdateProfile): Promise<Profile> {
			return client.request({
				method: "PATCH",
				path: "/me",
				body: parseInput(updateProfileSchema, input),
				response: profileSchema,
			});
		},
	};
}

export type MeResource = ReturnType<typeof createMeResource>;
