import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export class DatabaseConfigurationError extends Error {
  readonly name = "DatabaseConfigurationError"

  constructor() {
    super("DATABASE_URL is not configured")
  }
}

export function getDatabase() {
  const { DATABASE_URL: connectionString } = process.env
  if (!connectionString) {
    throw new DatabaseConfigurationError()
  }

  const client = postgres(connectionString, { prepare: false })
  return drizzle(client, { schema })
}
