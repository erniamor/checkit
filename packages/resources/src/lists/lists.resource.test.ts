import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import { fakeApi } from "../test/fake-fetch";
import { list, listId, paginated } from "../test/fixtures";

describe("lists", () => {
	it("lists the user's lists, without the API's envelope", async () => {
		const { api, requests } = fakeApi(200, paginated([list]));

		expect(await api.lists.list({ pageSize: 100 })).toEqual({
			items: [list],
			page: 1,
			pageSize: 50,
			total: 1,
		});
		expect(requests[0]?.url).toBe("http://api.test/v1/lists?pageSize=100");
	});

	it("gets a list", async () => {
		const { api, requests } = fakeApi(200, list);

		expect(await api.lists.get(listId)).toEqual(list);
		expect(requests[0]?.url).toBe(`http://api.test/v1/lists/${listId}`);
	});

	it("encodes the identifier, so it can't change the path", async () => {
		const { api, requests } = fakeApi(200, list);

		await api.lists.get("../me");

		expect(requests[0]?.url).toBe("http://api.test/v1/lists/..%2Fme");
	});

	it("answers NotFoundError for a list the user can't see", async () => {
		const { api } = fakeApi(404, {
			error: { code: "list_not_found", message: "List not found" },
		});

		await expect(api.lists.get(listId)).rejects.toBeInstanceOf(NotFoundError);
	});

	it("creates, renames, changes the kind of and deletes a list", async () => {
		const { api, requests } = fakeApi(200, list);

		await api.lists.create({ name: " Groceries " });
		await api.lists.update(listId, { name: "Weekend" });
		await api.lists.update(listId, { kind: "tasks" });
		await api.lists.remove(listId);

		expect(
			requests.map(({ method, url, body }) => ({ method, url, body })),
		).toEqual([
			{
				method: "POST",
				url: "http://api.test/v1/lists",
				body: { name: "Groceries" },
			},
			{
				method: "PATCH",
				url: `http://api.test/v1/lists/${listId}`,
				body: { name: "Weekend" },
			},
			{
				method: "PATCH",
				url: `http://api.test/v1/lists/${listId}`,
				body: { kind: "tasks" },
			},
			{
				method: "DELETE",
				url: `http://api.test/v1/lists/${listId}`,
				body: undefined,
			},
		]);
	});

	it("rejects an update that changes nothing before sending", async () => {
		const { api, fetch } = fakeApi(200, list);

		await expect(api.lists.update(listId, {})).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rejects a blank name before sending", async () => {
		const { api, fetch } = fakeApi(200, list);

		await expect(api.lists.create({ name: " " })).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(fetch).not.toHaveBeenCalled();
	});
});
