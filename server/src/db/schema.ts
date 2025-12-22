import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  question: text('question').notNull(),
  status: text('status').default('pending').notNull(), // pending, processing, completed, failed
  progress: integer('progress').default(0),
  result: text('result'),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
