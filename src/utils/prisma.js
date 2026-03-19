import prismaPkg from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";  // ✅ bon import
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);  // ✅ bon constructeur

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient({ adapter });

export default prisma;
