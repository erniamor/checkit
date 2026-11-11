import type { Profile } from "@repo/schemas";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { AuthUser } from "@/lib/auth";

export function toProfile(user: AuthUser): Profile {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		image: user.image ?? null,
	};
}

export async function updateName(
	user: AuthUser,
	name: string,
): Promise<Profile> {
	await db.update(users).set({ name }).where(eq(users.id, user.id));
	return toProfile({ ...user, name });
}
