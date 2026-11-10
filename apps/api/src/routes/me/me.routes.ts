import { Hono } from "hono";
import { type AuthVariables, requireAuth } from "@/middlewares/require-auth";
import { toProfile } from "@/routes/me/me.service";

export const meRoutes = new Hono<{ Variables: AuthVariables }>()
	.use(requireAuth)
	.get("/", (c) => c.json(toProfile(c.get("user"))));
