import { defineConfig } from "drizzle-kit";

const isTurso = !!process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    ...(isTurso && { authToken: process.env.TURSO_AUTH_TOKEN }),
  },
});
