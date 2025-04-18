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

// Soccer event games (renamed from weeks to games)
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameDate: timestamp("game_date").notNull(), // Single date for the game
  maxAttendees: integer("max_attendees").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  gameTime: text("game_time").default("5:00 PM"),
  location: text("location").default("City Park Fields"),
});

export const insertGameSchema = createInsertSchema(games)
  .omit({
    id: true,
  })
  .extend({
    // Accept ISO string dates and convert them to Date objects
    gameDate: z.string().transform((str) => new Date(str)),
  });

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// For backward compatibility - will be removed once migration is complete
export const weeks = games;
export const insertWeekSchema = insertGameSchema;
export type InsertWeek = InsertGame;
export type Week = Game;

// Attendees for each game
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  weekId: integer("week_id").notNull().references(() => games.id), // Keep column name for backward compatibility
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
export const gamesRelations = relations(games, ({ many }) => ({
  attendees: many(attendees),
}));

export const attendeesRelations = relations(attendees, ({ one }) => ({
  game: one(games, {
    fields: [attendees.weekId],
    references: [games.id],
  }),
}));

// For backward compatibility
export const weeksRelations = gamesRelations;