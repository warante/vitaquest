CREATE TABLE `daily_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`detail` text NOT NULL,
	`icon` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`record_id`) REFERENCES `daily_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_actions_record_slug_idx` ON `daily_actions` (`record_id`,`slug`);--> statement-breakpoint
CREATE TABLE `daily_records` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`record_date` text NOT NULL,
	`completed_actions` integer DEFAULT 0 NOT NULL,
	`total_actions` integer DEFAULT 0 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_records_profile_date_idx` ON `daily_records` (`profile_id`,`record_date`);--> statement-breakpoint
CREATE TABLE `lab_records` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`measured_at` text NOT NULL,
	`marker` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`reference_range` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`meal_date` text NOT NULL,
	`meal_type` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`goal_summary` text,
	`breakfast_pattern` text,
	`training_pattern` text,
	`steps_goal` integer DEFAULT 8000 NOT NULL,
	`fiber_goal` integer DEFAULT 30 NOT NULL,
	`strength_goal` integer DEFAULT 3 NOT NULL,
	`cardio_goal` integer DEFAULT 150 NOT NULL,
	`walks_goal` integer DEFAULT 10 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`workout_date` text NOT NULL,
	`activity` text NOT NULL,
	`minutes` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
