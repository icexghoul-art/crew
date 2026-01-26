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
        async (accessToken, refreshToken, profile, done) => {
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
  } else {
    console.warn(
      "Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET. Discord auth will not work.",
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
    passport.authenticate("discord", { callbackURL })(req, res, next);
  });

  app.get("/api/auth/discord/callback", (req, res, next) => {
    const callbackURL = getCallbackUrl(req);
    passport.authenticate("discord", {
      callbackURL,
      failureRedirect: "/",
    })(req, res, next);
  }, (req, res) => {
    res.redirect("/");
  });

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
    // Add logic here to check if user is admin or assignee
    const id = parseInt(req.params.id);
    const input = api.tickets.update.input.parse(req.body);
    const ticket = await storage.updateTicket(id, input);
    res.json(ticket);
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

  return httpServer;
}
