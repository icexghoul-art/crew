import { storage } from "./storage";
import { db } from "./db";
import { warTeams } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if users exist
  const existingUsers = await storage.getUser(1);
  if (!existingUsers) {
    console.log("Creating admin user...");
    await storage.createUser({
      username: "AdminUser",
      discordId: "123456789",
      avatar: "https://github.com/shadcn.png",
      role: "admin",
    });
    
    console.log("Creating guest user...");
    await storage.createUser({
      username: "NewPirate",
      discordId: "987654321",
      avatar: "https://github.com/shadcn.png",
      role: "guest",
    });
  }

  // Check tickets
  const existingTickets = await storage.getTickets();
  if (existingTickets.length === 0) {
    console.log("Creating sample tickets...");
    await storage.createTicket({
      type: "tryout",
      status: "open",
      creatorId: 2, // NewPirate
      content: "I want to join the crew! I have 5M bounty.",
    });
    
    await storage.createTicket({
      type: "war_request",
      status: "pending",
      creatorId: 2,
      content: "Requesting a 3v3 war against Red Haired Pirates.",
    });
  }

  // Check War Teams
  const existingTeams = await storage.getWarTeams();
  if (existingTeams.length === 0) {
    console.log("Creating war teams...");
    await db.insert(warTeams).values([
      { tier: "Z", memberIds: [] },
      { tier: "Y", memberIds: [] },
      { tier: "X", memberIds: [] },
      { tier: "S", memberIds: [] },
      { tier: "A", memberIds: [] },
    ]);
  }

  // Check Logs
  const existingLogs = await storage.getWarLogs();
  if (existingLogs.length === 0) {
    console.log("Creating sample war logs...");
    await storage.createWarLog({
      type: "3v3",
      opponentCrew: "Marine Hunters",
      result: "win",
      score: "3-1",
      loggedBy: 1, // Admin
      proofImage: "https://placehold.co/600x400/1e293b/white?text=Victory+Proof",
    });
    
    await storage.createWarLog({
      type: "2v2",
      opponentCrew: "Straw Hats",
      result: "loss",
      score: "1-2",
      loggedBy: 1,
      proofImage: "https://placehold.co/600x400/1e293b/white?text=Defeat+Proof",
    });
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
