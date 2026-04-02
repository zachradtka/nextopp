import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function createDB() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    // Production: use Turso
    const client = createClient({ url, authToken });
    return drizzle(client, { schema });
  }

  // Local development: use local SQLite file via libsql
  const client = createClient({ url: "file:local.db" });
  return drizzle(client, { schema });
}

export const db = createDB();
