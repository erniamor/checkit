import type { List, MemberRole } from "@repo/schemas";
import { signIn, WEB_ORIGIN } from "@test/helpers/auth";
import { eq } from "drizzle-orm";
import { app } from "@/app";
import { db } from "@/db/client";
import { listMembers, users } from "@/db/schema";

interface ApiRequest {
	method?: string;
	cookie?: string;
	body?: unknown;
	headers?: Record<string, string>;
}

/** Calls the API as the browser front end would, with an optional session cookie. */
export function api(
	path: string,
	{ method = "GET", cookie, body, headers: extraHeaders }: ApiRequest = {},
) {
	const headers: Record<string, string> = {
		Origin: WEB_ORIGIN,
		...extraHeaders,
	};
	if (cookie) {
		headers.Cookie = cookie;
	}
	if (body !== undefined) {
		headers["Content-Type"] = "application/json";
	}
	return app.request(path, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

/** Reads a JSON response body with the type the test expects. */
export async function json<T>(response: Response): Promise<T> {
	return (await response.json()) as T;
}

export async function createList(cookie: string, name = "Groceries") {
	const response = await api("/v1/lists", {
		method: "POST",
		cookie,
		body: { name },
	});
	if (response.status !== 201) {
		throw new Error(`List creation failed with status ${response.status}`);
	}
	return (await response.json()) as List;
}

/**
 * Signs a user in and makes them a member of the list, straight in the
 * database (sharing routes come later). Returns their session cookie.
 */
export async function joinList(
	listId: string,
	email: string,
	role: MemberRole,
): Promise<string> {
	const cookie = await signIn(email);
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email));
	if (!user) {
		throw new Error(`User ${email} not found`);
	}
	await db.insert(listMembers).values({ listId, userId: user.id, role });
	return cookie;
}
