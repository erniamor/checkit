import { listKinds } from "@repo/schemas";
import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";

export const listKind = pgEnum("list_kind", listKinds);

// The owner is the member with the "owner" role (see list-members.ts)
export const lists = pgTable("lists", {
	id: id(),
	name: text().notNull(),
	// Lists created before kinds existed were all purchases
	kind: listKind().notNull().default("purchases"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
