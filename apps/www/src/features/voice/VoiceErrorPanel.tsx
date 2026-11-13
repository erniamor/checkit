import { Button } from "@repo/ui";
import type { SpeechInputError } from "@/features/voice/speech-input";
import { m } from "@/paraglide/messages";

interface VoiceErrorPanelProps {
	error: SpeechInputError;
	onRetry: () => void;
}

const messages: Record<SpeechInputError, () => string> = {
	"not-allowed": m.voice_error_not_allowed,
	"no-speech": m.voice_error_no_speech,
	network: m.voice_error_network,
	unavailable: m.voice_error_unavailable,
	"too-many": m.voice_error_too_many,
	failed: m.voice_error_failed,
};

/** Why nothing was recognized, and a way to try again. */
export function VoiceErrorPanel({ error, onRetry }: VoiceErrorPanelProps) {
	return (
		<div className="grid gap-4">
			<p role="alert" className="text-destructive">
				{messages[error]()}
			</p>
			<Button type="button" onClick={onRetry} className="justify-self-end">
				{m.voice_retry()}
			</Button>
		</div>
	);
}
