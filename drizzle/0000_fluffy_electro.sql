CREATE TABLE "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"detail" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"detail" text NOT NULL,
	"icon" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_records" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"record_date" text NOT NULL,
	"completed_actions" integer DEFAULT 0 NOT NULL,
	"total_actions" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"exercise_name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exercise_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight" double precision,
	"weight_unit" text DEFAULT 'kg' NOT NULL,
	"completed" boolean DEFAULT true NOT NULL,
	"rpe" integer
);
--> statement-breakpoint
CREATE TABLE "lab_records" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"measured_at" text NOT NULL,
	"marker" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"reference_range" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"meal_date" text NOT NULL,
	"meal_type" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"goal_summary" text,
	"breakfast_pattern" text,
	"training_pattern" text,
	"steps_goal" integer DEFAULT 8000 NOT NULL,
	"fiber_goal" integer DEFAULT 30 NOT NULL,
	"strength_goal" integer DEFAULT 3 NOT NULL,
	"cardio_goal" integer DEFAULT 150 NOT NULL,
	"walks_goal" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"session_date" text NOT NULL,
	"workout_type" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"rpe" integer,
	"feeling" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"workout_date" text NOT NULL,
	"activity" text NOT NULL,
	"minutes" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_actions" ADD CONSTRAINT "daily_actions_record_id_daily_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."daily_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_entries" ADD CONSTRAINT "exercise_entries_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_entry_id_exercise_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."exercise_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_records" ADD CONSTRAINT "lab_records_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_actions_record_slug_idx" ON "daily_actions" USING btree ("record_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_records_profile_date_idx" ON "daily_records" USING btree ("profile_id","record_date");