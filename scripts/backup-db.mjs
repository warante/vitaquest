import { execFileSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"

const BACKUP_DIR = join(process.cwd(), "backups")
const KEEP = Number.parseInt(process.env.BACKUP_KEEP ?? "14", 10)
const DB_FILE = join(process.cwd(), "vitaquest.db")

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
}

function pruneOldBackups() {
  if (!existsSync(BACKUP_DIR)) return
  const files = readdirSync(BACKUP_DIR)
    .map((name) => ({ name, mtime: statSync(join(BACKUP_DIR, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  for (const file of files.slice(KEEP)) {
    rmSync(join(BACKUP_DIR, file.name), { force: true })
  }
}

function backupSqlite() {
  const target = join(BACKUP_DIR, `vitaquest-${timestamp()}.db`)
  copyFileSync(DB_FILE, target)
  return target
}

function backupPostgres() {
  const target = join(BACKUP_DIR, `vitaquest-${timestamp()}.sql`)
  execFileSync("pg_dump", ["--no-owner", "--clean", "--file", target, process.env.DATABASE_URL], {
    stdio: "inherit",
  })
  return target
}

function main() {
  ensureBackupDir()

  if (process.env.DATABASE_URL) {
    const target = backupPostgres()
    console.log(`Backup PostgreSQL creado en ${target}`)
  } else {
    if (!existsSync(DB_FILE)) {
      console.error("No se encontró vitaquest.db y DATABASE_URL no está configurada.")
      process.exit(1)
    }
    const target = backupSqlite()
    console.log(`Backup SQLite creado en ${target}`)
  }

  pruneOldBackups()
  console.log(`Se conservan los últimos ${KEEP} backups.`)
}

main()
