import { createFileRoute } from "@tanstack/react-router";
import { NewListPage } from "@/features/lists/NewListPage";

export const Route = createFileRoute("/_authenticated/lists/new")({
	component: NewListPage,
});
