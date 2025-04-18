import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage, IStorage } from "./storage";
import { z } from "zod";
import { insertAttendeeSchema, insertWeekSchema } from "@shared/schema";

// Extend Express Session to include session data
declare module 'express-session' {
  interface SessionData {
    myAttendees?: Record<number, number[]>; // weekId -> attendeeIds mapping
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with an active week if none exists
  try {
    const activeWeek = await storage.getActiveWeek();
    if (!activeWeek) {
      // Create initial active game for today
      const gameDate = new Date();
      
      await storage.createWeek({
        gameDate,
        maxAttendees: 10,
        isActive: true,
        gameTime: "5:00 PM",
        location: "City Park Fields"
      });
      console.log("Created initial active game");
    }
  } catch (error) {
    console.error("Failed to initialize active game:", error);
  }

  // API prefix for all routes
  const apiPrefix = "/api";

  // Weeks API
  app.get(`${apiPrefix}/weeks`, async (req, res) => {
    try {
      const weeks = await storage.getAllWeeks();
      res.json(weeks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weeks" });
    }
  });

  app.get(`${apiPrefix}/weeks/active`, async (req, res) => {
    try {
      const week = await storage.getActiveWeek();
      if (!week) {
        return res.status(404).json({ message: "No active week found" });
      }
      res.json(week);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active week" });
    }
  });

  app.get(`${apiPrefix}/weeks/:id`, async (req, res) => {
    try {
      const weekId = parseInt(req.params.id);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "Invalid week ID" });
      }

      const week = await storage.getWeek(weekId);
      if (!week) {
        return res.status(404).json({ message: "Week not found" });
      }
      
      res.json(week);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch week" });
    }
  });

  app.post(`${apiPrefix}/weeks`, async (req, res) => {
    try {
      console.log("Creating new week with data:", JSON.stringify(req.body));
      const weekData = insertWeekSchema.parse(req.body);
      console.log("Parsed week data:", JSON.stringify(weekData));
      const week = await storage.createWeek(weekData);
      res.status(201).json(week);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ message: "Invalid week data", errors: error.errors });
      }
      console.error("Error creating week:", error);
      res.status(500).json({ message: "Failed to create week" });
    }
  });

  app.patch(`${apiPrefix}/weeks/:id`, async (req, res) => {
    try {
      const weekId = parseInt(req.params.id);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "Invalid week ID" });
      }

      const weekData = req.body;
      const week = await storage.updateWeek(weekId, weekData);
      if (!week) {
        return res.status(404).json({ message: "Week not found" });
      }
      
      res.json(week);
    } catch (error) {
      res.status(500).json({ message: "Failed to update week" });
    }
  });

  // Attendees API
  app.get(`${apiPrefix}/weeks/:weekId/attendees`, async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "Invalid week ID" });
      }

      const week = await storage.getWeek(weekId);
      if (!week) {
        return res.status(404).json({ message: "Week not found" });
      }

      // Get user's attendees for this game from session
      const myAttendeeIds = req.session.myAttendees?.[weekId] || [];
      
      const attendees = await storage.getAttendeesByWeek(weekId);
      
      // Mark attendees that belong to the current session user
      const attendeesWithOwnership = attendees.map(attendee => ({
        ...attendee,
        isMyAttendee: myAttendeeIds.includes(attendee.id)
      }));
      
      const confirmed = attendeesWithOwnership.filter(a => !a.isWaitlist);
      const waitlist = attendeesWithOwnership.filter(a => a.isWaitlist);
      
      res.json({
        confirmed,
        waitlist,
        maxAttendees: week.maxAttendees
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  app.post(`${apiPrefix}/weeks/:weekId/attendees`, async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      if (isNaN(weekId)) {
        return res.status(400).json({ message: "Invalid week ID" });
      }

      const week = await storage.getWeek(weekId);
      if (!week) {
        return res.status(404).json({ message: "Week not found" });
      }
      
      // Check if admin mode is enabled (for admin page)
      const isAdminMode = req.body.admin === true;
      
      // Initialize session data if not present
      if (!req.session.myAttendees) {
        req.session.myAttendees = {};
      }
      
      // If not admin mode, check if user already registered for this game
      if (!isAdminMode && req.session.myAttendees[weekId] && req.session.myAttendees[weekId].length > 0) {
        return res.status(400).json({ 
          message: "You've already registered for this game",
          alreadyRegistered: true
        });
      }

      // Parse and validate using the attendee schema with extended validation
      const attendeeData = insertAttendeeSchema.extend({
        name: z.string().min(1, "Name is required")
      }).parse({
        ...req.body,
        weekId
      });

      // Determine if new attendee should go on waitlist based on current attendees
      const confirmedAttendees = await storage.getConfirmedAttendeesByWeek(weekId);
      const isWaitlist = confirmedAttendees.length >= week.maxAttendees;

      const attendee = await storage.createAttendee({
        ...attendeeData,
        isWaitlist
      });
      
      // If not admin mode, store the attendee ID in the user's session
      if (!isAdminMode) {
        if (!req.session.myAttendees[weekId]) {
          req.session.myAttendees[weekId] = [];
        }
        req.session.myAttendees[weekId].push(attendee.id);
        
        // Save the session
        req.session.save();
      }
      
      res.status(201).json({
        attendee,
        isWaitlist,
        isMyAttendee: !isAdminMode // Only mark as "my attendee" for normal users
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendee" });
    }
  });

  app.patch(`${apiPrefix}/attendees/:id`, async (req, res) => {
    try {
      const attendeeId = parseInt(req.params.id);
      if (isNaN(attendeeId)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }

      const attendeeData = req.body;
      const attendee = await storage.updateAttendee(attendeeId, attendeeData);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendee" });
    }
  });

  app.delete(`${apiPrefix}/attendees/:id`, async (req, res) => {
    try {
      const attendeeId = parseInt(req.params.id);
      if (isNaN(attendeeId)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }
      
      // Get the attendee to check which game they belong to
      const attendee = await storage.getAttendeeById(attendeeId);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      // Check if admin mode is enabled via query parameter (for admin page)
      const isAdminMode = req.query.admin === "true";
      
      // If not in admin mode, check if this attendee is in the user's session
      if (!isAdminMode && (!req.session.myAttendees || 
          !req.session.myAttendees[attendee.weekId] || 
          !req.session.myAttendees[attendee.weekId].includes(attendeeId))) {
        return res.status(403).json({ 
          message: "You can only remove your own name from the list",
          notAuthorized: true
        });
      }

      // Perform the delete
      const deleted = await storage.deleteAttendee(attendeeId);
      if (!deleted) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      // If the deleted attendee was in this user's session, update the session
      if (req.session.myAttendees && 
          req.session.myAttendees[attendee.weekId] && 
          req.session.myAttendees[attendee.weekId].includes(attendeeId)) {
        req.session.myAttendees[attendee.weekId] = req.session.myAttendees[attendee.weekId].filter(id => id !== attendeeId);
        req.session.save();
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendee" });
    }
  });

  // Promote from waitlist
  app.post(`${apiPrefix}/weeks/:weekId/promote-from-waitlist/:attendeeId`, async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const attendeeId = parseInt(req.params.attendeeId);
      
      if (isNaN(weekId) || isNaN(attendeeId)) {
        return res.status(400).json({ message: "Invalid ID parameters" });
      }

      const week = await storage.getWeek(weekId);
      if (!week) {
        return res.status(404).json({ message: "Week not found" });
      }

      const confirmedAttendees = await storage.getConfirmedAttendeesByWeek(weekId);
      if (confirmedAttendees.length >= week.maxAttendees) {
        return res.status(400).json({ message: "No available spots to promote from waitlist" });
      }

      // Find the attendee to promote
      const attendee = await storage.updateAttendee(attendeeId, { isWaitlist: false });
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to promote from waitlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
