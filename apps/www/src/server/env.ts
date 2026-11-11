import { z } from "zod";
import { getPublicEnv } from "@/env";

const serverApiUrlSchema = z.url().optional();

/**
 * URL of the API for the server's requests: API_URL (e.g. an internal address)
 * if set, otherwise the public one. Server-only: reads the process environment.
 */
export function getServerApiUrl(): string {
	return (
		serverApiUrlSchema.parse(process.env.API_URL) ?? getPublicEnv().VITE_API_URL
	);
}
