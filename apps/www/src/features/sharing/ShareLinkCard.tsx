import type { ShareableRole, ShareLink } from "@repo/schemas";
import { Button, Input, Label, toast } from "@repo/ui";
import { CopyIcon, Link2OffIcon } from "lucide-react";
import { useId, useRef } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { IconButton } from "@/components/IconButton";
import { useOrigin } from "@/lib/use-origin";
import { m } from "@/paraglide/messages";

interface ShareLinkCardProps {
	role: ShareableRole;
	link: ShareLink | undefined;
	pending: boolean;
	onCreate: () => void;
	onRevoke: (linkId: string) => void;
}

/** The URL to share for a link's token. */
export function shareLinkUrl(origin: string, token: string): string {
	return `${origin}/join/${token}`;
}

/** The share link of one role: created, copied or revoked by the owner. */
export function ShareLinkCard({
	role,
	link,
	pending,
	onCreate,
	onRevoke,
}: ShareLinkCardProps) {
	const origin = useOrigin();
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const title =
		role === "editor" ? m.share_link_editor() : m.share_link_viewer();

	async function copy(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			toast.success(m.toast_link_copied());
		} catch {
			// No clipboard (old browser, insecure context): let the user copy it
			inputRef.current?.select();
		}
	}

	return (
		<div className="grid gap-2 rounded-lg border border-border p-4">
			{link ? (
				<>
					<Label htmlFor={inputId}>{title}</Label>
					<div className="flex flex-wrap items-center gap-2">
						<Input
							id={inputId}
							ref={inputRef}
							readOnly
							value={shareLinkUrl(origin, link.token)}
							onFocus={(event) => event.currentTarget.select()}
							className="min-w-48 flex-1"
						/>
						<IconButton
							icon={CopyIcon}
							label={m.copy_link_button()}
							variant="outline"
							onClick={() => copy(shareLinkUrl(origin, link.token))}
						/>
						<ConfirmButton
							label={m.revoke_link_button()}
							icon={Link2OffIcon}
							title={m.revoke_link_title()}
							description={m.revoke_link_text()}
							confirmLabel={m.revoke_link_button()}
							pending={pending}
							onConfirm={() => onRevoke(link.id)}
						/>
					</div>
				</>
			) : (
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="font-medium text-sm">{title}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={pending}
						onClick={onCreate}
					>
						{m.create_link_button()}
					</Button>
				</div>
			)}
		</div>
	);
}
