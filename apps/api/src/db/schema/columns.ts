import { timestamp, uuid } from "drizzle-orm/pg-core";

// Column helpers shared by the tables of the schema

export const id = () => uuid().primaryKey().defaultRandom();

export const createdAt = () =>
	timestamp({ withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
	timestamp({ withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date());
