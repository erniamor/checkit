import { getAuthTables } from "better-auth/db";
import { getTableColumns, is, Table } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";

// Guards against drift after a Better Auth upgrade: every field it expects must
// exist in our Drizzle schema, and its required fields must be NOT NULL.
const tables: Record<string, Table> = {};
for (const [name, value] of Object.entries(schema)) {
	if (is(value, Table)) {
		tables[name] = value;
	}
}

describe("Better Auth tables", () => {
	const expected = Object.values(getAuthTables(auth.options));

	it.each(expected.map((table) => [table.modelName, table] as const))(
		"%s matches the Drizzle schema",
		(modelName, table) => {
			// The Drizzle adapter is configured with usePlural
			const drizzleTable = tables[`${modelName}s`];
			expect(drizzleTable, `missing table ${modelName}s`).toBeDefined();
			if (!drizzleTable) return;

			const columns = getTableColumns(drizzleTable);
			for (const [field, attributes] of Object.entries(table.fields)) {
				const column = columns[attributes.fieldName ?? field];
				expect(column, `missing column ${modelName}s.${field}`).toBeDefined();
				if (attributes.required) {
					expect(
						column?.notNull,
						`${modelName}s.${field} must be NOT NULL`,
					).toBe(true);
				}
			}
		},
	);
});
