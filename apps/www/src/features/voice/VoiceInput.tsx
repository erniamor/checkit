import type { Item } from "@repo/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@repo/ui";
import { MicIcon } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { ListeningPanel } from "@/features/voice/ListeningPanel";
import { SpokenItemsReview } from "@/features/voice/SpokenItemsReview";
import { splitSpokenItems } from "@/features/voice/split-spoken-items";
import { TranscribingPanel } from "@/features/voice/TranscribingPanel";
import { useVoiceInput } from "@/features/voice/use-voice-input";
import { VoiceErrorPanel } from "@/features/voice/VoiceErrorPanel";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

interface VoiceInputProps {
	/** The list's items, to say which spoken ones it already has. */
	items: readonly Item[];
	onAdd: (labels: string[]) => void;
	className?: string;
}

/**
 * A microphone button: the user says several items, checks them, then adds
 * them. Not rendered where the browser can't recognize speech.
 */
export function VoiceInput({ items, onAdd, className }: VoiceInputProps) {
	const voice = useVoiceInput();
	const { state } = voice;

	if (!voice.supported) {
		return null;
	}

	return (
		<>
			<IconButton
				label={m.voice_input_button()}
				icon={MicIcon}
				variant="outline"
				className={className}
				onClick={voice.start}
			/>
			<Dialog
				open={state.status !== "idle"}
				onOpenChange={(open) => {
					if (!open) {
						voice.reset();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{m.voice_dialog_title()}</DialogTitle>
						<DialogDescription>{m.voice_dialog_text()}</DialogDescription>
					</DialogHeader>
					{state.status === "listening" && (
						<ListeningPanel text={state.text} onStop={voice.stop} />
					)}
					{state.status === "transcribing" && <TranscribingPanel />}
					{state.status === "error" && (
						<VoiceErrorPanel error={state.error} onRetry={voice.start} />
					)}
					{state.status === "heard" && (
						<SpokenItemsReview
							text={state.text}
							labels={splitSpokenItems(state.text, getLocale())}
							items={items}
							onRetry={voice.start}
							onAdd={(labels) => {
								onAdd(labels);
								voice.reset();
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
