import { Button } from "@repo/ui";
import { MicIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

interface ListeningPanelProps {
	/** What was heard so far; nothing while a recording waits for transcription. */
	text: string;
	onStop: () => void;
}

/** While listening: what's heard shows as it comes, until the user is done. */
export function ListeningPanel({ text, onStop }: ListeningPanelProps) {
	return (
		<div className="grid gap-4">
			<p role="status" className="flex items-center gap-2 font-medium">
				<MicIcon aria-hidden className="size-4 animate-pulse text-primary" />
				{m.voice_listening()}
			</p>
			<p className="text-muted-foreground text-sm">
				{m.voice_listening_hint()}
			</p>
			{text && <p className="rounded-md border border-border p-3">{text}</p>}
			<Button type="button" onClick={onStop} className="justify-self-end">
				{m.voice_stop()}
			</Button>
		</div>
	);
}
