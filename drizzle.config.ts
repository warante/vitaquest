import { defineConfig } from "drizzle-kit"

const { DATABASE_URL } = process.env

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL ?? "postgresql://localhost/vitaquest",
  },
})
