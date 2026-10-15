CREATE TABLE `nightfall_members` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`input` text DEFAULT '{}' NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nightfall_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`snapshot` text DEFAULT '{}' NOT NULL,
	`updated` integer NOT NULL
);
