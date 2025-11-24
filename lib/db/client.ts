import { Pool } from "pg"

// Create a connection pool
let pool: Pool | null = null

export function getDbPool(): Pool {
  if (pool) {
    return pool
  }

  // Get connection string from environment variable
  // Railway provides this as DATABASE_URL
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  return pool
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const db = getDbPool()
  const start = Date.now()
  try {
    const res = await db.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Database query error", { text, error })
    throw error
  }
}

