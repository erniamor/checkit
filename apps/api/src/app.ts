import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "@/env";
import { handleError, handleNotFound } from "@/lib/error-handler";
import { errorBody } from "@/lib/errors";
import { healthRoutes } from "@/routes/health/health.routes";

const MAX_BODY_SIZE = 1024 * 1024;

const v1 = new Hono().route("/health", healthRoutes);

export const app = new Hono();

if (env.NODE_ENV === "development") {
	app.use(logger());
}

app
	.use(secureHeaders())
	.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
	.use(
		bodyLimit({
			maxSize: MAX_BODY_SIZE,
			onError: (c) =>
				c.json(
					errorBody("payload_too_large", "Request body is too large"),
					413,
				),
		}),
	)
	.route("/v1", v1);

app.onError(handleError);
app.notFound(handleNotFound);
