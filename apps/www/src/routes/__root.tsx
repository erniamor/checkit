import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import {
	serverHtmlClass,
	systemAppearanceScript,
} from "@/features/appearance/appearance";
import { getAppearance } from "@/features/appearance/get-appearance";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import stylesUrl from "@/styles.css?url";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: () => ({ appearance: getAppearance() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: m.app_name() },
		],
		links: [{ rel: "stylesheet", href: stylesUrl }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	const { appearance } = Route.useRouteContext();

	return (
		// With the "system" appearance, the class set by the script below differs
		// from the server's: React must not treat it as a hydration error
		<html
			lang={getLocale()}
			className={serverHtmlClass(appearance)}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
				{/* Constant script: applies the system's appearance before the first paint */}
				{appearance === "system" && (
					<script
						dangerouslySetInnerHTML={{ __html: systemAppearanceScript }}
					/>
				)}
			</head>
			<body>
				<Header appearance={appearance} />
				<main>{children}</main>
				<Scripts />
			</body>
		</html>
	);
}
