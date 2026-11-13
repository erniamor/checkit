import { transcriptionQuerySchema } from "@repo/schemas";
import { Hono } from "hono";
import { validate } from "@/lib/validator";
import { type AuthVariables, requireAuth } from "@/middlewares/require-auth";
import { audioHeadersSchema } from "@/routes/transcriptions/transcriptions.schemas";
import { transcribe } from "@/routes/transcriptions/transcriptions.service";

export const transcriptionsRoutes = new Hono<{ Variables: AuthVariables }>()
	.use(requireAuth)
	.post(
		"/",
		validate("query", transcriptionQuerySchema),
		validate("header", audioHeadersSchema),
		async (c) =>
			c.json(
				await transcribe(
					c.get("user").id,
					await c.req.blob(),
					c.req.valid("query").language,
				),
			),
	);
