import { createMiddleware } from "hono/factory";
import { type AuthSession, type AuthUser, auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export interface AuthVariables {
	user: AuthUser;
	session: AuthSession;
}

/** Rejects the request with a 401 unless it carries a valid session cookie. */
export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
	async (c, next) => {
		const result = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!result) {
			throw new AppError(401, "unauthorized", "Sign-in required");
		}
		c.set("user", result.user);
		c.set("session", result.session);
		await next();
	},
);
