import {
	NetworkError,
	NotFoundError,
	RateLimitError,
	ServerError,
	ValidationError,
} from "@repo/resources";
import { describe, expect, it } from "vitest";
import { formErrors, saveErrorMessage } from "@/lib/error-messages";
import { setTestLocale } from "@/test/locale";

describe("formErrors", () => {
	it("translates each invalid field", () => {
		setTestLocale("fr");

		const errors = formErrors(
			new ValidationError(422, "validation_error", "Invalid", [
				{ field: "email", message: "email_invalid" },
			]),
		);

		expect(errors).toEqual({
			fields: { email: "Saisissez une adresse e-mail valide." },
		});
	});

	it("translates a known error code for the whole form", () => {
		setTestLocale("es");

		expect(
			formErrors(new ValidationError(400, "invalid_otp", "Invalid OTP", []))
				.form,
		).toBe(
			"Este código es incorrecto. Revisa el último correo que te enviamos.",
		);
	});

	it("explains rate limits and network failures", () => {
		expect(formErrors(new RateLimitError(429, "http_429", "")).form).toBe(
			"Too many attempts. Wait a minute and try again.",
		);
		expect(formErrors(new NetworkError(new TypeError())).form).toBe(
			"Checkit can't be reached. Check your connection and try again.",
		);
	});

	it("falls back to a generic message", () => {
		expect(formErrors(new NotFoundError(404, "unknown_code", "")).form).toBe(
			"Something went wrong. Try again.",
		);
		expect(formErrors("not even an error").form).toBe(
			"Something went wrong. Try again.",
		);
	});
});

describe("saveErrorMessage", () => {
	it("says the change wasn't saved, unless the user is offline or rate limited", () => {
		expect(saveErrorMessage(new ServerError(500, "internal_error", ""))).toBe(
			"Your change couldn't be saved. Try again.",
		);
		expect(saveErrorMessage(new NetworkError(new TypeError()))).toBe(
			"Checkit can't be reached. Check your connection and try again.",
		);
		expect(saveErrorMessage(new RateLimitError(429, "http_429", ""))).toBe(
			"Too many attempts. Wait a minute and try again.",
		);
	});
});
