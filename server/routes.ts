import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertAttendeeSchema, insertWeekSchema } from "@shared/schema";

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

      const attendees = await storage.getAttendeesByWeek(weekId);
      const confirmed = attendees.filter(a => !a.isWaitlist);
      const waitlist = attendees.filter(a => a.isWaitlist);
      
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
      
      res.status(201).json({
        attendee,
        isWaitlist
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

      const deleted = await storage.deleteAttendee(attendeeId);
      if (!deleted) {
        return res.status(404).json({ message: "Attendee not found" });
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
