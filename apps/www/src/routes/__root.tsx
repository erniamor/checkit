import { Toaster, TooltipProvider } from "@repo/ui";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { Header } from "@/components/Header";
import {
	serverHtmlClass,
	systemAppearanceScript,
} from "@/features/appearance/appearance";
import { getAppearance } from "@/features/appearance/get-appearance";
import { meQueryOptions } from "@/features/auth/me-query";
import { listenForInstallPrompt } from "@/features/pwa/install-prompt";
import { registerServiceWorker } from "@/features/pwa/service-worker";
import { themeColorMetas } from "@/features/pwa/theme-color";
import { getTheme } from "@/features/theme/get-theme";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import stylesUrl from "@/styles.css?url";

// As early as possible: the browser's install offer can come before hydration
if (typeof window !== "undefined") {
	listenForInstallPrompt(window);
}

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context, location }) => {
		const me = await context.queryClient.ensureQueryData(meQueryOptions());
		// A user without a name chooses one before anything else
		if (me && !me.name && location.pathname !== "/welcome") {
			throw redirect({ to: "/welcome", search: { redirect: location.href } });
		}
		return { appearance: getAppearance(), theme: getTheme(), me };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: m.app_name() },
			{ name: "apple-mobile-web-app-title", content: m.app_name() },
		],
		links: [
			{ rel: "stylesheet", href: stylesUrl },
			{ rel: "manifest", href: `/manifest.webmanifest?lang=${getLocale()}` },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	const { appearance, theme, me } = Route.useRouteContext();

	// Syncs with the browser: installable app, offline page
	useEffect(() => {
		void registerServiceWorker();
	}, []);

	return (
		// With the "system" appearance, the class set by the script below differs
		// from the server's: React must not treat it as a hydration error
		<html
			lang={getLocale()}
			data-theme={theme}
			className={serverHtmlClass(appearance)}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
				{/* Installed app: the bars around the page take the header's color.
				Here rather than in head(), which keeps one tag per name */}
				{themeColorMetas(theme, appearance).map((meta) => (
					<meta key={meta.media} {...meta} />
				))}
				{/* Constant script: applies the system's appearance before the first paint */}
				{appearance === "system" && (
					<script
						dangerouslySetInnerHTML={{ __html: systemAppearanceScript }}
					/>
				)}
			</head>
			<body>
				{/* One provider for the app's tooltips: hovering from one to the next
				shows it without the delay */}
				<TooltipProvider>
					<Header appearance={appearance} theme={theme} me={me} />
					<main>{children}</main>
				</TooltipProvider>
				<Toaster theme={appearance} position="bottom-center" />
				<Scripts />
			</body>
		</html>
	);
}
