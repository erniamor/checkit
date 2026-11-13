import { afterEach, vi } from "vitest";

/**
 * Stands for the browser's MediaRecorder: the test says what the user said
 * (`say()`), the recorder gives it as one chunk when stopped. Installed with
 * the microphone by `installMediaRecorder()`.
 */
export class FakeMediaRecorder {
	static instances: FakeMediaRecorder[] = [];

	/** The recorder created last. */
	static latest(): FakeMediaRecorder {
		const latest = FakeMediaRecorder.instances.at(-1);
		if (!latest) {
			throw new Error("No recording started");
		}
		return latest;
	}

	state: RecordingState = "inactive";
	mimeType = "audio/ogg;codecs=opus";
	ondataavailable: ((event: { data: Blob }) => void) | null = null;
	onstop: (() => void) | null = null;
	private said: string[] = [];

	constructor(
		readonly stream: MediaStream,
		readonly options?: MediaRecorderOptions,
	) {
		FakeMediaRecorder.instances.push(this);
	}

	start() {
		this.state = "recording";
	}

	/** The user speaks: this is recorded. */
	say(sound: string) {
		this.said.push(sound);
	}

	stop() {
		if (this.state !== "recording") {
			return;
		}
		this.state = "inactive";
		this.ondataavailable?.({
			data: new Blob(this.said, { type: this.mimeType }),
		});
		this.onstop?.();
	}
}

interface Microphone {
	/** Whether the browser's microphone is still on. */
	on: () => boolean;
	getUserMedia: ReturnType<typeof vi.fn>;
}

/**
 * Gives the browser a microphone and MediaRecorder until the end of the test;
 * `denied`: the user refuses the microphone.
 */
export function installMediaRecorder({ denied = false } = {}): Microphone {
	let on = false;
	const track = {
		stop: () => {
			on = false;
		},
	};
	const stream = { getTracks: () => [track] } as unknown as MediaStream;
	const getUserMedia = vi.fn(async () => {
		if (denied) {
			throw new DOMException("Permission denied", "NotAllowedError");
		}
		on = true;
		return stream;
	});
	vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
	Object.defineProperty(window.navigator, "mediaDevices", {
		value: { getUserMedia },
		configurable: true,
	});
	return { on: () => on, getUserMedia };
}

afterEach(() => {
	FakeMediaRecorder.instances = [];
	Reflect.deleteProperty(window.navigator, "mediaDevices");
});
