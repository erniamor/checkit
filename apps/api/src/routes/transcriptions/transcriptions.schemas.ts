import { z } from "zod";

// The body is the recording itself, typed by its Content-Type
export const audioHeadersSchema = z.object({
	"content-type": z.string().regex(/^audio\//i, "audio_required"),
});
