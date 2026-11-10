import { Hono } from "hono";
import { db } from "@/db/client";
import { getHealth } from "@/routes/health/health.service";

export const healthRoutes = new Hono().get("/", async (c) => {
	const health = await getHealth(db);
	return c.json(health, health.database === "up" ? 200 : 503);
});
