import { Toaster } from "@repo/ui";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListPage } from "@/features/lists/ListPage";
import { fakeListServer, listId } from "@/test/fake-list-server";
import {
	FakeSpeechRecognition,
	installSpeechRecognition,
} from "@/test/fake-speech-recognition";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

function renderList(server: ReturnType<typeof fakeListServer>) {
	const requests = mockApi(server.respond);
	renderWithRouter(
		<>
			<ListPage listId={listId} />
			<Toaster />
		</>,
	);
	return { requests, user: userEvent.setup() };
}

/** Says `sentence` into the microphone, opened from the list. */
async function speak(
	user: ReturnType<typeof userEvent.setup>,
	sentence: string,
) {
	await user.click(
		await screen.findByRole("button", { name: "Add items by voice" }),
	);
	const recognition = FakeSpeechRecognition.latest();
	act(() => recognition.hear(sentence));
	return recognition;
}

describe("ListPage: voice input", () => {
	it("hides the microphone where the browser can't recognize speech", async () => {
		renderList(fakeListServer());

		await screen.findByLabelText("New item");

		expect(
			screen.queryByRole("button", { name: "Add items by voice" }),
		).not.toBeInTheDocument();
	});

	it("hides the microphone from a viewer", async () => {
		installSpeechRecognition();
		renderList(fakeListServer({ role: "viewer", items: ["Milk"] }));

		await screen.findByRole("heading", { level: 1, name: "Groceries" });

		expect(
			screen.queryByRole("button", { name: "Add items by voice" }),
		).not.toBeInTheDocument();
	});

	it("shows what's heard, then adds the reviewed items", async () => {
		installSpeechRecognition();
		const server = fakeListServer({ items: ["Butter ✓", "Jam"] });
		const { user, requests } = renderList(server);

		const recognition = await speak(user, "some milk, eggs and bread");
		const dialog = screen.getByRole("dialog", { name: "Add by voice" });
		expect(within(dialog).getByRole("status")).toHaveTextContent("Listening…");
		expect(within(dialog).getByText("some milk, eggs and bread")).toBeVisible();
		expect(recognition.lang).toBe("en-US");

		await user.click(within(dialog).getByRole("button", { name: "Done" }));
		expect(within(dialog).getByLabelText("Item 1")).toHaveValue("Milk");
		expect(within(dialog).getByLabelText("Item 2")).toHaveValue("Eggs");
		expect(within(dialog).getByLabelText("Item 3")).toHaveValue("Bread");

		await user.clear(within(dialog).getByLabelText("Item 3"));
		await user.type(within(dialog).getByLabelText("Item 3"), "Butter");
		expect(
			within(dialog).getByText("Checked in the list: it will be unchecked."),
		).toBeVisible();
		await user.click(
			within(dialog).getByRole("button", { name: "Remove “Eggs”" }),
		);
		await user.click(
			within(dialog).getByRole("button", { name: "Add to the list" }),
		);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(
			await screen.findByText("Added: Milk. Back in the list: Butter."),
		).toBeVisible();
		expect(requests).toContainEqual({
			method: "POST",
			path: `/lists/${listId}/items/batch`,
			body: { labels: ["Milk", "Butter"] },
		});
		expect(server.labels()).toEqual(["Butter", "Jam", "Milk"]);
		expect(screen.getByRole("checkbox", { name: "Butter" })).not.toBeChecked();
	});

	it("says which spoken items the list already has", async () => {
		installSpeechRecognition();
		const { user } = renderList(fakeListServer({ items: ["Jam"] }));

		const recognition = await speak(user, "jam");
		act(() => recognition.stop());

		expect(
			screen.getByText("Already in the list: it won't be added again."),
		).toBeVisible();
	});

	it("explains a blocked microphone, and listens again on request", async () => {
		installSpeechRecognition();
		const { user } = renderList(fakeListServer());

		const recognition = await speak(user, "");
		act(() => recognition.fail("not-allowed"));

		expect(screen.getByRole("alert")).toHaveTextContent(
			"The microphone is blocked.",
		);
		await user.click(screen.getByRole("button", { name: "Speak again" }));
		expect(FakeSpeechRecognition.instances).toHaveLength(2);
		expect(FakeSpeechRecognition.latest().listening).toBe(true);
	});

	it("says when nothing was heard", async () => {
		installSpeechRecognition();
		const { user } = renderList(fakeListServer());

		const recognition = await speak(user, "");
		act(() => recognition.stop());

		expect(screen.getByRole("alert")).toHaveTextContent("Nothing was heard.");
	});

	it("stops the microphone when the dialog is closed", async () => {
		installSpeechRecognition();
		const { user } = renderList(fakeListServer());

		const recognition = await speak(user, "milk");
		await user.keyboard("{Escape}");

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(recognition.listening).toBe(false);
	});
});
