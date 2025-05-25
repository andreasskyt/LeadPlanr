import { Pool } from 'pg'
import { decrypt, encrypt } from './encryption'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

console.log('Attempting to connect to database...')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test the connection and permissions
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err)
    console.error('Connection details:', {
      host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0],
      database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
      user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0]
    })
    return
  }
  if (!client) {
    console.error('No client returned from pool')
    return
  }
  try {
    // Test query to verify permissions
    const result = await client.query('SELECT current_user, current_database()')
    console.log('Database connection test:', {
      user: result.rows[0].current_user,
      database: result.rows[0].current_database
    })
    
    // Test calendar_accounts table access
    await client.query('SELECT 1 FROM calendar_accounts LIMIT 1')
    console.log('Successfully verified calendar_accounts table access')
  } catch (error) {
    console.error('Error testing database permissions:', error)
  } finally {
    release()
  }
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
    console.log('Executing query:', { text, params });
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed successfully', { 
      text, 
      duration, 
      rows: res.rowCount,
      firstRow: res.rows[0] ? Object.keys(res.rows[0]) : null
    });
    return res;
  } catch (error) {
    console.error('Error executing query', { 
      text, 
      params,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });
    throw error;
  }
}

// Calendar account types
export interface CalendarAccount {
  id: number;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  valid_from: Date;
  valid_to: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

// Calendar account operations
export const calendarAccounts = {
  // Create a new calendar account
  async create(data: Omit<CalendarAccount, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating calendar account with data:', {
      provider: data.provider,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      validFrom: data.valid_from,
      validTo: data.valid_to,
      userId: data.user_id
    });

    try {
      const { rows } = await query(
        `INSERT INTO calendar_accounts 
         (provider, access_token, refresh_token, valid_from, valid_to, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.provider, data.access_token, data.refresh_token, data.valid_from, data.valid_to, data.user_id]
      );
      console.log('Calendar account created successfully:', { id: rows[0].id });
      return rows[0];
    } catch (error) {
      console.error('Error creating calendar account:', error);
      throw error;
    }
  },

  // Get calendar accounts for a user
  async getByUserId(userId: string) {
    const { rows } = await query(
      'SELECT * FROM calendar_accounts WHERE user_id = $1',
      [userId]
    );
    
    // Decrypt refresh tokens
    return rows.map(row => ({
      ...row,
      refresh_token: row.refresh_token ? decrypt(row.refresh_token) : null
    }));
  },

  // Update a calendar account
  async update(id: string, data: Partial<CalendarAccount>) {
    // If refresh_token is being updated, ensure it's encrypted
    if (data.refresh_token) {
      data.refresh_token = encrypt(data.refresh_token)
    }

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

    // Decrypt refresh token in response
    if (rows[0]) {
      rows[0].refresh_token = rows[0].refresh_token ? decrypt(rows[0].refresh_token) : null
    }
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