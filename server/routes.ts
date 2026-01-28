import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Auth Setup
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "default_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Discord Strategy
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  // Use a dynamic callback URL based on the request host
  const getCallbackUrl = (req: any) => {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"];
    return `${protocol}://${host}/api/auth/discord/callback`;
  };

  if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: DISCORD_CLIENT_ID,
          clientSecret: DISCORD_CLIENT_SECRET,
          callbackURL: "", // Will be set dynamically in the route
          scope: ["identify"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const existingUser = await storage.getUserByDiscordId(profile.id);
            if (existingUser) {
              // Update avatar if changed
              if (
                existingUser.avatar !==
                `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              ) {
                await storage.updateUser(existingUser.id, {
                  avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
                });
              }
              return done(null, existingUser);
            }

            // Create new user
            const newUser = await storage.createUser({
              username: profile.username,
              discordId: profile.id,
              avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
              role: "guest", // Default role
            });
            return done(null, newUser);
          } catch (err) {
            return done(err as Error);
          }
        },
      ),
    );
  }

  // === AUTH ROUTES ===

  app.get("/api/auth/discord", (req, res, next) => {
    if (!DISCORD_CLIENT_ID) {
      return res
        .status(500)
        .send(
          "Discord Auth not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET secrets.",
        );
    }
    const callbackURL = getCallbackUrl(req);
    passport.authenticate("discord", { callbackURL } as any)(req, res, next);
  });

  app.get(
    "/api/auth/discord/callback",
    (req, res, next) => {
      const callbackURL = getCallbackUrl(req);
      passport.authenticate("discord", {
        callbackURL,
        failureRedirect: "/",
      } as any)(req, res, next);
    },
    (req, res) => {
      res.redirect("/");
    },
  );

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json(null);
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  // === TICKET ROUTES ===
  app.get(api.tickets.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tickets = await storage.getTickets();
    res.json(tickets);
  });

  app.get(api.tickets.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id as string);
    const ticket = await storage.getTicketWithMessages(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  });

  app.post(api.tickets.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.tickets.create.input.parse(req.body);
      const ticket = await storage.createTicket({
        ...input,
        creatorId: (req.user as any).id,
      });
      res.status(201).json(ticket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.tickets.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id as string);
    const input = api.tickets.update.input.parse(req.body);
    const ticket = await storage.updateTicket(id, input);
    res.json(ticket);
  });

  app.post(api.tickets.addMessage.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id as string);
    const user = (req.user as any);
    const ticket = await storage.getTicketWithMessages(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    
    // Vérifier les permissions
    const isCreator = ticket.creatorId === user.id;
    const isAdmin = user.role === "admin";
    const isModerator = user.role === "moderator";
    const isWarFighter = user.role === "war_fighter";
    const isTryouter = user.role === "tryouter";
    
    const canAccessTryoutTicket = isCreator || isAdmin || isModerator || isTryouter;
    const canAccessWarTicket = isCreator || isAdmin || isModerator || isWarFighter;
    
    if (ticket.type === "tryout" && !canAccessTryoutTicket) {
      return res.status(403).json({ message: "You don't have permission to message this ticket" });
    }
    if (ticket.type === "war_request" && !canAccessWarTicket) {
      return res.status(403).json({ message: "You don't have permission to message this ticket" });
    }
    
    const input = api.tickets.addMessage.input.parse(req.body);
    const message = await storage.addTicketMessage({
      ticketId: id,
      senderId: user.id,
      content: input.content,
    });
    res.status(201).json({ ...message, sender: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } });
  });

  // === ADMIN ROUTES ===
  app.get(api.admin.users.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch(api.admin.updateUser.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id as string);
    const input = api.admin.updateUser.input.parse(req.body);
    const user = await storage.updateUser(id, input);
    res.json(user);
  });

  app.patch("/api/admin/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const id = parseInt(req.params.id as string);
      const { role } = req.body;
      
      if (!["admin", "moderator", "member", "guest", "war_fighter", "tryouter"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUser(id, { role });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // === WAR LOG ROUTES ===
  app.get(api.warLogs.list.path, async (req, res) => {
    const logs = await storage.getWarLogs();
    res.json(logs);
  });

  app.post(api.warLogs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.warLogs.create.input.parse(req.body);
      const log = await storage.createWarLog({
        ...input,
        loggedBy: (req.user as any).id,
      });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === PVP LOG ROUTES ===
  app.get(api.pvpLogs.list.path, async (req, res) => {
    const logs = await storage.getPvpLogs();
    res.json(logs);
  });

  app.post(api.pvpLogs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.pvpLogs.create.input.parse(req.body);
      const log = await storage.createPvpLog({
        ...input,
        loggedBy: (req.user as any).id,
      });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === WAR TEAMS ROUTES ===
  app.get(api.warTeam.list.path, async (req, res) => {
    const teams = await storage.getWarTeams();
    res.json(teams);
  });

  app.patch(api.warTeam.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);

    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const input = api.warTeam.update.input.parse(req.body);
      const team = await storage.updateWarTeam(parseInt(id), input);
      
      // Update roles for members in war team
      if (input.memberIds) {
        for (const memberId of input.memberIds) {
          await storage.updateUser(memberId, { role: "war_fighter" });
        }
      }
      
      res.json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}