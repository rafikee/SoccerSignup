import { 
  users, 
  type User, 
  type InsertUser, 
  games, 
  type Game, 
  type InsertGame, 
  attendees, 
  type Attendee, 
  type InsertAttendee 
} from "@shared/schema";

// For backward compatibility
import {
  type Week,
  type InsertWeek,
} from "@shared/schema";

export interface IStorage {
  // User methods 
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game methods (names kept as weeks for backward compatibility)
  getAllWeeks(): Promise<Game[]>; // Returns all games
  getWeek(id: number): Promise<Game | undefined>; // Gets a specific game by ID
  getActiveWeek(): Promise<Game | undefined>; // Gets the active game
  createWeek(game: InsertGame): Promise<Game>; // Creates a new game
  updateWeek(id: number, data: Partial<Game>): Promise<Game | undefined>; // Updates a game

  // Attendee methods
  getAttendeesByWeek(gameId: number): Promise<Attendee[]>; // Gets all attendees for a game
  getConfirmedAttendeesByWeek(gameId: number): Promise<Attendee[]>; // Gets confirmed (non-waitlist) attendees
  getWaitlistByWeek(gameId: number): Promise<Attendee[]>; // Gets waitlisted attendees
  getAttendeeById(id: number): Promise<Attendee | undefined>; // Gets a single attendee by ID
  createAttendee(attendee: InsertAttendee): Promise<Attendee>; // Adds an attendee (auto-determines waitlist status)
  updateAttendee(id: number, data: Partial<Attendee>): Promise<Attendee | undefined>; // Updates an attendee
  deleteAttendee(id: number): Promise<boolean>; // Removes an attendee (and promotes from waitlist)
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weeks: Map<number, Week>;
  private attendees: Map<number, Attendee>;
  private userCurrentId: number;
  private weekCurrentId: number;
  private attendeeCurrentId: number;

  constructor() {
    this.users = new Map();
    this.weeks = new Map();
    this.attendees = new Map();
    this.userCurrentId = 1;
    this.weekCurrentId = 1;
    this.attendeeCurrentId = 1;
    
    // Create initial active game when storage is initialized
    const now = new Date();
    
    this.createWeek({
      gameDate: now,
      maxAttendees: 10,
      isActive: true,
      gameTime: "5:00 PM",
      location: "City Park Fields"
    });
  }

  // User methods (unchanged)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Week methods
  async getAllWeeks(): Promise<Week[]> {
    return Array.from(this.weeks.values()).sort((a, b) => 
      new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
    );
  }

  async getWeek(id: number): Promise<Week | undefined> {
    return this.weeks.get(id);
  }

  async getActiveWeek(): Promise<Week | undefined> {
    return Array.from(this.weeks.values()).find(week => week.isActive);
  }

  async createWeek(insertWeek: InsertWeek): Promise<Week> {
    // Set all existing weeks to inactive when creating a new active week
    if (insertWeek.isActive) {
      for (const week of this.weeks.values()) {
        if (week.isActive) {
          this.weeks.set(week.id, { ...week, isActive: false });
        }
      }
    }

    const id = this.weekCurrentId++;
    const week: Week = { ...insertWeek, id };
    this.weeks.set(id, week);
    return week;
  }

  async updateWeek(id: number, data: Partial<Week>): Promise<Week | undefined> {
    const week = this.weeks.get(id);
    if (!week) return undefined;

    // If setting this week to active, set all others to inactive
    if (data.isActive) {
      for (const w of this.weeks.values()) {
        if (w.id !== id && w.isActive) {
          this.weeks.set(w.id, { ...w, isActive: false });
        }
      }
    }

    const updatedWeek = { ...week, ...data };
    this.weeks.set(id, updatedWeek);
    return updatedWeek;
  }

  // Attendee methods
  async getAttendeesByWeek(weekId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values())
      .filter(a => a.weekId === weekId)
      .sort((a, b) => new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime());
  }

  async getConfirmedAttendeesByWeek(weekId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values())
      .filter(a => a.weekId === weekId && !a.isWaitlist)
      .sort((a, b) => new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime());
  }

  async getWaitlistByWeek(weekId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values())
      .filter(a => a.weekId === weekId && a.isWaitlist)
      .sort((a, b) => new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime());
  }
  
  async getAttendeeById(id: number): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const id = this.attendeeCurrentId++;
    const signupTime = new Date();
    
    // Determine if attendee should be on waitlist based on current count and max
    let isWaitlist = insertAttendee.isWaitlist;
    
    if (!isWaitlist) {
      const week = await this.getWeek(insertAttendee.weekId);
      if (week) {
        const confirmed = await this.getConfirmedAttendeesByWeek(insertAttendee.weekId);
        isWaitlist = confirmed.length >= week.maxAttendees;
      }
    }
    
    const attendee: Attendee = { 
      ...insertAttendee, 
      id, 
      signupTime,
      isWaitlist 
    };
    
    this.attendees.set(id, attendee);
    return attendee;
  }

  async updateAttendee(id: number, data: Partial<Attendee>): Promise<Attendee | undefined> {
    const attendee = this.attendees.get(id);
    if (!attendee) return undefined;

    const updatedAttendee = { ...attendee, ...data };
    this.attendees.set(id, updatedAttendee);
    return updatedAttendee;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    return this.attendees.delete(id);
  }
}

// Import and use the DatabaseStorage instead of MemStorage
import { DatabaseStorage } from './db-storage';
export const storage = new DatabaseStorage();
