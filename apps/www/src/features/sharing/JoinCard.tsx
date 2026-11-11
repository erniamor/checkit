import type { ShareableRole } from "@repo/schemas";
import type { ReactNode } from "react";
import { m } from "@/paraglide/messages";

interface JoinCardProps {
	listName: string;
	/** Who invited or shared, when known. */
	from?: string;
	role: ShareableRole;
	/** The actions: join, sign in, sign out... */
	children: ReactNode;
}

/** What an invitation or a share link offers, before joining the list. */
export function JoinCard({ listName, from, role, children }: JoinCardProps) {
	return (
		<section className="mx-auto grid max-w-md gap-4 px-4 py-12">
			<h1 className="break-words font-heading font-semibold text-2xl">
				{m.join_title({ list: listName })}
			</h1>
			{from && <p>{from}</p>}
			<p className="text-muted-foreground">
				{role === "editor" ? m.join_role_editor() : m.join_role_viewer()}
			</p>
			<div className="grid gap-3">{children}</div>
		</section>
	);
}
