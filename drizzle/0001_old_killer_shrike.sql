CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`slug` text,
	`title` text NOT NULL,
	`detail` text,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
