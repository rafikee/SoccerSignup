import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  attendees, type Attendee, type InsertAttendee
} from "@shared/schema";

// For backward compatibility
import { weeks, type Week, type InsertWeek } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Game methods (renamed from Week)
  async getAllWeeks(): Promise<Week[]> {
    return db
      .select()
      .from(games)
      .orderBy(desc(games.gameDate));
  }

  async getWeek(id: number): Promise<Week | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getActiveWeek(): Promise<Week | undefined> {
    const [game] = await db.select().from(games).where(eq(games.isActive, true));
    return game || undefined;
  }

  async createWeek(insertWeek: InsertWeek): Promise<Week> {
    // Set all existing games to inactive when creating a new active game
    if (insertWeek.isActive) {
      await db
        .update(games)
        .set({ isActive: false })
        .where(eq(games.isActive, true));
    }

    const [game] = await db
      .insert(games)
      .values(insertWeek)
      .returning();
    return game;
  }

  async updateWeek(id: number, data: Partial<Week>): Promise<Week | undefined> {
    // If setting this game to active, set all others to inactive
    if (data.isActive) {
      await db
        .update(games)
        .set({ isActive: false })
        .where(and(eq(games.isActive, true), sql`${games.id} != ${id}`));
    }

    const [game] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }

  // Attendee methods
  async getAttendeesByWeek(weekId: number): Promise<Attendee[]> {
    return db
      .select()
      .from(attendees)
      .where(eq(attendees.weekId, weekId))
      .orderBy(attendees.signupTime);
  }

  async getConfirmedAttendeesByWeek(weekId: number): Promise<Attendee[]> {
    return db
      .select()
      .from(attendees)
      .where(and(
        eq(attendees.weekId, weekId),
        eq(attendees.isWaitlist, false)
      ))
      .orderBy(attendees.signupTime);
  }

  async getWaitlistByWeek(weekId: number): Promise<Attendee[]> {
    return db
      .select()
      .from(attendees)
      .where(and(
        eq(attendees.weekId, weekId),
        eq(attendees.isWaitlist, true)
      ))
      .orderBy(attendees.signupTime);
  }
  
  async getAttendeeById(id: number): Promise<Attendee | undefined> {
    const [attendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, id));
    return attendee || undefined;
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    // Determine if attendee should be on waitlist based on current count and max
    let isWaitlist = insertAttendee.isWaitlist;
    
    if (!isWaitlist) {
      const week = await this.getWeek(insertAttendee.weekId);
      if (week) {
        const confirmed = await this.getConfirmedAttendeesByWeek(insertAttendee.weekId);
        isWaitlist = confirmed.length >= week.maxAttendees;
      }
    }
    
    const [attendee] = await db
      .insert(attendees)
      .values({ ...insertAttendee, isWaitlist })
      .returning();
    
    return attendee;
  }

  async updateAttendee(id: number, data: Partial<Attendee>): Promise<Attendee | undefined> {
    const [attendee] = await db
      .update(attendees)
      .set(data)
      .where(eq(attendees.id, id))
      .returning();
    return attendee || undefined;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    // Get the attendee before deleting to determine if we need to promote from waitlist
    const [attendeeToDelete] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, id));
    
    if (attendeeToDelete && !attendeeToDelete.isWaitlist) {
      // This is a confirmed attendee, so promote the first person from waitlist
      const gameId = attendeeToDelete.weekId;
      const [nextInWaitlist] = await db
        .select()
        .from(attendees)
        .where(and(
          eq(attendees.weekId, gameId),
          eq(attendees.isWaitlist, true)
        ))
        .orderBy(attendees.signupTime)
        .limit(1);
      
      // If there's someone on the waitlist, promote them
      if (nextInWaitlist) {
        await db
          .update(attendees)
          .set({ isWaitlist: false })
          .where(eq(attendees.id, nextInWaitlist.id));
      }
    }
    
    // Now delete the attendee
    const [deleted] = await db
      .delete(attendees)
      .where(eq(attendees.id, id))
      .returning();
    
    return !!deleted;
  }
}