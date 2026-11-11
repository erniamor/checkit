import { Toaster } from "@repo/ui";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import {
	serverHtmlClass,
	systemAppearanceScript,
} from "@/features/appearance/appearance";
import { getAppearance } from "@/features/appearance/get-appearance";
import { meQueryOptions } from "@/features/auth/me-query";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import stylesUrl from "@/styles.css?url";

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
		return { appearance: getAppearance(), me };
	},
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
	const { appearance, me } = Route.useRouteContext();

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
				<Header appearance={appearance} me={me} />
				<main>{children}</main>
				<Toaster theme={appearance} position="bottom-center" />
				<Scripts />
			</body>
		</html>
	);
}
