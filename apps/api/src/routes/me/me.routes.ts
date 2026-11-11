import { updateProfileSchema } from "@repo/schemas";
import { Hono } from "hono";
import { validate } from "@/lib/validator";
import { type AuthVariables, requireAuth } from "@/middlewares/require-auth";
import { toProfile, updateName } from "@/routes/me/me.service";

export const meRoutes = new Hono<{ Variables: AuthVariables }>()
	.use(requireAuth)
	.get("/", (c) => c.json(toProfile(c.get("user"))))
	.patch("/", validate("json", updateProfileSchema), async (c) =>
		c.json(await updateName(c.get("user"), c.req.valid("json").name)),
	);
