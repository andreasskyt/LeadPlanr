import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

console.log('Attempting to connect to database...')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err)
    console.error('Connection details:', {
      host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0],
      database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
      user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0]
    })
    return
  }
  console.log('Successfully connected to the database')
  release()
})

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export default pool 