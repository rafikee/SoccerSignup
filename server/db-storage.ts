import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import { 
  users, type User, type InsertUser,
  weeks, type Week, type InsertWeek,
  attendees, type Attendee, type InsertAttendee
} from "@shared/schema";

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

  // Week methods
  async getAllWeeks(): Promise<Week[]> {
    return db
      .select()
      .from(weeks)
      .orderBy(desc(weeks.startDate));
  }

  async getWeek(id: number): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.id, id));
    return week || undefined;
  }

  async getActiveWeek(): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.isActive, true));
    return week || undefined;
  }

  async createWeek(insertWeek: InsertWeek): Promise<Week> {
    // Set all existing weeks to inactive when creating a new active week
    if (insertWeek.isActive) {
      await db
        .update(weeks)
        .set({ isActive: false })
        .where(eq(weeks.isActive, true));
    }

    const [week] = await db
      .insert(weeks)
      .values(insertWeek)
      .returning();
    return week;
  }

  async updateWeek(id: number, data: Partial<Week>): Promise<Week | undefined> {
    // If setting this week to active, set all others to inactive
    if (data.isActive) {
      await db
        .update(weeks)
        .set({ isActive: false })
        .where(eq(weeks.isActive, true));
    }

    const [week] = await db
      .update(weeks)
      .set(data)
      .where(eq(weeks.id, id))
      .returning();
    return week || undefined;
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
      .where(eq(attendees.weekId, weekId))
      .where(eq(attendees.isWaitlist, false))
      .orderBy(attendees.signupTime);
  }

  async getWaitlistByWeek(weekId: number): Promise<Attendee[]> {
    return db
      .select()
      .from(attendees)
      .where(eq(attendees.weekId, weekId))
      .where(eq(attendees.isWaitlist, true))
      .orderBy(attendees.signupTime);
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
    const [deleted] = await db
      .delete(attendees)
      .where(eq(attendees.id, id))
      .returning();
    return !!deleted;
  }
}