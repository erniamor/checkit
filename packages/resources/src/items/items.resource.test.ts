import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { fakeApi } from "../test/fake-fetch";
import { item, itemId, listId, paginated } from "../test/fixtures";

const itemsUrl = `http://api.test/v1/lists/${listId}/items`;

describe("items", () => {
	it("lists a list's items, without the API's envelope", async () => {
		const { api, requests } = fakeApi(200, paginated([item]));

		const page = await api.items.list(listId, { pageSize: 200 });

		expect(page.items).toEqual([item]);
		expect(page.total).toBe(1);
		expect(requests[0]?.url).toBe(`${itemsUrl}?pageSize=200`);
	});

	it("adds one item", async () => {
		const { api, requests } = fakeApi(201, item);

		expect(await api.items.add(listId, { label: " Milk " })).toEqual(item);
		expect(requests[0]).toMatchObject({
			method: "POST",
			url: itemsUrl,
			body: { label: "Milk" },
		});
	});

	it("adds several items, returned without the envelope", async () => {
		const { api, requests } = fakeApi(201, { data: [item, item] });

		expect(
			await api.items.addMany(listId, { labels: ["Milk", "Eggs"] }),
		).toEqual([item, item]);
		expect(requests[0]?.url).toBe(`${itemsUrl}/batch`);
	});

	it("updates and deletes an item", async () => {
		const { api, requests } = fakeApi(200, { ...item, done: true });

		await api.items.update(listId, itemId, { done: true });
		await api.items.remove(listId, itemId);

		expect(
			requests.map(({ method, url, body }) => ({ method, url, body })),
		).toEqual([
			{ method: "PATCH", url: `${itemsUrl}/${itemId}`, body: { done: true } },
			{ method: "DELETE", url: `${itemsUrl}/${itemId}`, body: undefined },
		]);
	});

	it("rejects an empty change before sending", async () => {
		const { api, fetch } = fakeApi(200, item);

		const error = await api.items
			.update(listId, itemId, {})
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ValidationError);
		expect((error as ValidationError).issues).toEqual([
			{ field: "", message: "nothing_to_update" },
		]);
		expect(fetch).not.toHaveBeenCalled();
	});
});
