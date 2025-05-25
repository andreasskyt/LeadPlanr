import { config } from 'dotenv'
import { resolve } from 'path'
import { Pool } from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    // Start transaction
    await client.query('BEGIN')

    // Get all migration files and sort them
    const migrationsDir = join(process.cwd(), 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    // Run each migration in order
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`)
      const migrationPath = join(migrationsDir, file)
      const migrationSQL = readFileSync(migrationPath, 'utf8')
      await client.query(migrationSQL)
    }
    
    // Commit transaction
    await client.query('COMMIT')
    console.log('All migrations completed successfully')
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK')
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error) 