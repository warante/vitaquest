import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseConfigurationError"
  }
}

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>

let dbInstance: AppDatabase | null = null

export async function getDatabase(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance

  // biome-ignore lint/complexity/useLiteralKeys: ProcessEnv requires indexed access in strict TypeScript.
  const connectionString = process.env["DATABASE_URL"]
  if (!connectionString) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL no está configurado. Define la URL de PostgreSQL para usar persistencia.",
    )
  }

  try {
    const client = postgres(connectionString, { max: 1, prepare: false })
    dbInstance = drizzle(client, { schema })
    return dbInstance
  } catch (error) {
    console.error("[vitaquest-db] error al inicializar PostgreSQL:", error)
    throw new DatabaseConfigurationError(
      "No se pudo inicializar la conexión a PostgreSQL. Verifica DATABASE_URL.",
    )
  }
}
