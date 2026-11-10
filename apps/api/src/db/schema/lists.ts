import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";

// The owner is the member with the "owner" role (see list-members.ts)
export const lists = pgTable("lists", {
	id: id(),
	name: text().notNull(),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
