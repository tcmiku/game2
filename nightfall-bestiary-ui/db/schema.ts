import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('nightfall_rooms', {
 code: text('code').primaryKey(), host: text('host').notNull(), status: text('status').notNull().default('lobby'), snapshot: text('snapshot').notNull().default('{}'), updated: integer('updated').notNull(),
});
export const members = sqliteTable('nightfall_members', {
 id: text('id').primaryKey(), code: text('code').notNull(), token: text('token').notNull(), name: text('name').notNull(), input: text('input').notNull().default('{}'), seen: integer('seen').notNull(),
});
