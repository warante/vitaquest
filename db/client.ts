import * as fs from "node:fs"
import * as path from "node:path"
import { drizzle } from "drizzle-orm/sql-js"
import initSqlJs, { type BindParams, type Database as SqlJsDatabase } from "sql.js"
import * as schema from "./schema"

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DatabaseConfigurationError"
  }
}

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>

const DB_FILE = path.join(process.cwd(), "vitaquest.db")

const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i

let sqlPromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> | null = null
let dbInstance: AppDatabase | null = null

function persist(db: SqlJsDatabase): void {
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()))
}

function createPersistentDatabase(db: SqlJsDatabase): SqlJsDatabase {
  const originalPrepare = db.prepare.bind(db)
  db.prepare = (sql: string) => {
    const statement = originalPrepare(sql)
    if (WRITE_RE.test(sql)) {
      const originalRun = statement.run.bind(statement)
      statement.run = (params?: BindParams) => {
        const result = originalRun(params)
        persist(db)
        return result
      }
    }
    return statement
  }
  return db
}

export async function getDatabase(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance

  try {
    if (!sqlPromise) {
      sqlPromise = initSqlJs({
        locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
      })
    }

    const SQL = await sqlPromise
    let db: SqlJsDatabase
    if (fs.existsSync(DB_FILE)) {
      db = new SQL.Database(fs.readFileSync(DB_FILE))
    } else {
      db = new SQL.Database()
    }

    dbInstance = drizzle(createPersistentDatabase(db), { schema })
    return dbInstance
  } catch (error) {
    console.error("[vitaquest-db] error al inicializar SQLite:", error)
    throw new DatabaseConfigurationError(
      "No se pudo inicializar la base de datos SQLite. Verifica que sql.js esté instalado.",
    )
  }
}
