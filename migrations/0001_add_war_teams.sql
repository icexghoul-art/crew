CREATE TABLE "war_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"member_ids" json DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
