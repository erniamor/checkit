import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

/** `:token` route parameter; an unknown token answers 404 further on. */
export const tokenParamSchema = z.object({ token: z.string().min(1).max(128) });

/** A random, URL-safe token (256 bits), for invitation and share links. */
export function generateToken(): string {
	return randomBytes(32).toString("base64url");
}

/** SHA-256 of a token, to store it without being able to read it back. */
export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}
