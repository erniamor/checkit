export const listId = "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
export const itemId = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const userId = "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f";
const date = "2026-11-10T08:00:00.000Z";

export const list = {
	id: listId,
	name: "Groceries",
	kind: "purchases",
	role: "owner",
	itemCount: 2,
	doneCount: 1,
	createdAt: date,
	updatedAt: date,
};

export const item = {
	id: itemId,
	listId,
	label: "Milk",
	done: false,
	doneAt: null,
	doneById: null,
	position: 1,
	createdById: userId,
	createdAt: date,
	updatedAt: date,
};

export function paginated<T>(data: T[]) {
	return {
		data,
		pagination: { page: 1, pageSize: 50, total: data.length },
	};
}
