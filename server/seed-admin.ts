import "dotenv/config";
import bcrypt from "bcrypt";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_USERNAME = "Carmen";
const ADMIN_PASSWORD = "Anglia2014";
const SALT_ROUNDS = 10;

async function seedAdmin() {
  console.log("🔐 Seeding admin user...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, ADMIN_USERNAME))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("⚠️  Admin user already exists. Updating password...");
      
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          role: "admin",
          loginMethod: "local",
          lastSignedIn: new Date()
        })
        .where(eq(users.username, ADMIN_USERNAME));
      
      console.log("✅ Admin user password updated successfully!");
    } else {
      console.log("➕ Creating new admin user...");
      
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      
      await db.insert(users).values({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: ADMIN_USERNAME,
        email: null,
        role: "admin",
        loginMethod: "local",
        lastSignedIn: new Date(),
        createdAt: new Date(),
      });
      
      console.log("✅ Admin user created successfully!");
    }

    console.log("\n📋 Admin Credentials:");
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("\n⚠️  Please change the password after first login!\n");
    
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedAdmin();
