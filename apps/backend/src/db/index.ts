// ──────────────────────────────────────────────
// Drizzle DB Instance
// ──────────────────────────────────────────────

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString = process.env.DATABASE_URL!;

// Create postgres.js client
const client = postgres(connectionString);

// Create and export Drizzle instance with schema for relational queries
export const db = drizzle(client, { schema });
