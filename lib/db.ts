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

// Helper function to run queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Calendar account types
export interface CalendarAccount {
  id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  valid_from: Date;
  valid_to: Date | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

// Calendar account operations
export const calendarAccounts = {
  // Create a new calendar account
  async create(data: Omit<CalendarAccount, 'id' | 'created_at' | 'updated_at'>) {
    const { rows } = await query(
      `INSERT INTO calendar_accounts 
       (provider, access_token, refresh_token, valid_from, valid_to, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.provider, data.access_token, data.refresh_token, data.valid_from, data.valid_to, data.user_id]
    );
    return rows[0];
  },

  // Get calendar accounts for a user
  async getByUserId(userId: string) {
    const { rows } = await query(
      'SELECT * FROM calendar_accounts WHERE user_id = $1',
      [userId]
    );
    return rows;
  },

  // Update a calendar account
  async update(id: string, data: Partial<CalendarAccount>) {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(data);
    const { rows } = await query(
      `UPDATE calendar_accounts 
       SET ${setClause}
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  },

  // Delete a calendar account
  async delete(id: string) {
    const { rows } = await query(
      'DELETE FROM calendar_accounts WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }
};

export default pool 