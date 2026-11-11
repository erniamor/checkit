import handler from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "@/paraglide/server";

// Detects the locale of each request (cookie, then Accept-Language) so that
// getLocale() and the messages use it during server rendering
export default {
	fetch(request: Request): Promise<Response> {
		return paraglideMiddleware(request, () => handler.fetch(request));
	},
};
