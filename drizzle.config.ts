import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(databaseUrl
    ? { dbCredentials: { url: databaseUrl } }
    : { driver: "pglite", dbCredentials: { url: "./data/pglite" } }),
});
