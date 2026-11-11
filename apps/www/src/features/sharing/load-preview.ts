import { ApiError, NotFoundError } from "@repo/resources";
import { notFound } from "@tanstack/react-router";

/**
 * Loads the preview of an invitation or share link: an unknown token is the
 * "not found" page, an expired or revoked one (410) gives `null`.
 */
export async function loadPreview<T>(
	load: () => Promise<T>,
): Promise<{ preview: T | null }> {
	try {
		return { preview: await load() };
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw notFound();
		}
		if (error instanceof ApiError && error.status === 410) {
			return { preview: null };
		}
		throw error;
	}
}
