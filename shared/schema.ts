import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Soccer event weeks
export const weeks = pgTable("weeks", {
  id: serial("id").primaryKey(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxAttendees: integer("max_attendees").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  gameTime: text("game_time").default("Sunday, 5:00 PM"),
  location: text("location").default("City Park Fields"),
});

export const insertWeekSchema = createInsertSchema(weeks).omit({
  id: true,
});

export type InsertWeek = z.infer<typeof insertWeekSchema>;
export type Week = typeof weeks.$inferSelect;

// Attendees for each week
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull(),
  name: text("name").notNull(),
  signupTime: timestamp("signup_time").notNull().defaultNow(),
  isWaitlist: boolean("is_waitlist").notNull().default(false),
});

export const insertAttendeeSchema = createInsertSchema(attendees).omit({
  id: true,
  signupTime: true,
});

export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type Attendee = typeof attendees.$inferSelect;

// Set up relations after all tables are defined
export const weeksRelations = relations(weeks, ({ many }) => ({
  attendees: many(attendees),
}));

export const attendeesRelations = relations(attendees, ({ one }) => ({
  week: one(weeks, {
    fields: [attendees.weekId],
    references: [weeks.id],
  }),
}));