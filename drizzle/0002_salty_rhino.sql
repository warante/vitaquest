CREATE TABLE `exercise_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`notes` text,
	FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercise_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight` real,
	`weight_unit` text DEFAULT 'kg' NOT NULL,
	`completed` integer DEFAULT true NOT NULL,
	`rpe` integer,
	FOREIGN KEY (`entry_id`) REFERENCES `exercise_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`session_date` text NOT NULL,
	`workout_type` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`rpe` integer,
	`feeling` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
