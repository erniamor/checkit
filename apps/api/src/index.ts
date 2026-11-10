import { serve } from "@hono/node-server";
import { app } from "@/app";
import { client } from "@/db/client";
import { env } from "@/env";

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
	console.log(`API listening on http://localhost:${info.port}`);
});

function shutdown() {
	server.close(async () => {
		await client.end();
		process.exit(0);
	});
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
