import { memberRoles } from "@repo/schemas";
import { index, pgEnum, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createdAt } from "@/db/schema/columns";
import { lists } from "@/db/schema/lists";
import { users } from "@/db/schema/users";

export const memberRole = pgEnum("member_role", memberRoles);

export const listMembers = pgTable(
	"list_members",
	{
		listId: uuid()
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: memberRole().notNull(),
		createdAt: createdAt(),
	},
	(table) => [
		primaryKey({ columns: [table.listId, table.userId] }),
		// "My lists" are looked up by user
		index().on(table.userId),
	],
);
