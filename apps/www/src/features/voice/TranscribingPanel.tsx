import { LoaderCircleIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

/** While the recording is turned into text. */
export function TranscribingPanel() {
	return (
		<p role="status" className="flex items-center gap-2 font-medium">
			<LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
			{m.voice_transcribing()}
		</p>
	);
}
