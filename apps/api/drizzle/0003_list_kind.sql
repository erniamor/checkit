CREATE TYPE "public"."list_kind" AS ENUM('purchases', 'tasks');--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "kind" "list_kind" DEFAULT 'purchases' NOT NULL;