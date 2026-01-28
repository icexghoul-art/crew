CREATE TABLE "pvp_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"winner_id" integer NOT NULL,
	"loser_name" text NOT NULL,
	"score" text NOT NULL,
	"proof_image" text,
	"logged_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"creator_id" integer NOT NULL,
	"assignee_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"discord_id" text,
	"avatar" text,
	"role" text DEFAULT 'guest' NOT NULL,
	"war_team_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "war_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"opponent_crew" text NOT NULL,
	"result" text NOT NULL,
	"score" text NOT NULL,
	"proof_image" text,
	"logged_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "war_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"color" text NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_war_team_id_war_teams_id_fk" FOREIGN KEY ("war_team_id") REFERENCES "public"."war_teams"("id") ON DELETE no action ON UPDATE no action;