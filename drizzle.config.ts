import type { Config } from "drizzle-kit"

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/complexity/useLiteralKeys: ProcessEnv requires indexed access in strict TypeScript.
    url: process.env["DATABASE_URL"] ?? "",
  },
} satisfies Config
