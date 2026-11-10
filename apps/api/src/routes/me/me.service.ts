import type { AuthUser } from "@/lib/auth";

export interface Profile {
	id: string;
	email: string;
	name: string;
	image: string | null;
}

export function toProfile(user: AuthUser): Profile {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		image: user.image ?? null,
	};
}
