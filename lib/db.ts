import { Pool } from 'pg'
import { decrypt, encrypt } from './encryption'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

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
    // console.log('Database connection test:', {
    //   user: result.rows[0].current_user,
    //   database: result.rows[0].current_database
    // })
    
    // Test calendar_accounts table access
    await client.query('SELECT 1 FROM calendar_accounts LIMIT 1')
    //console.log('Successfully verified calendar_accounts table access')
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
export async function query<T = any>(text: string, params?: any[]) {
  //console.log('Executing query:', { text, params })
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    // const duration = Date.now() - start
    // console.log('Query executed successfully:', {
    //   duration,
    //   rows: result.rows.length
    // })
    return result
  } catch (error) {
    console.error('Error executing query:', {
      error,
      text,
      params
    })
    throw error
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
  // Create a new calendar account (and encrypt the refresh token)
  async create(data: Omit<CalendarAccount, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating calendar account with data:', {
      ...data,
      access_token: data.access_token ? '[REDACTED]' : undefined,
      refresh_token: data.refresh_token ? '[REDACTED]' : undefined
    })
    const encryptedRefreshToken = data.refresh_token ? encrypt(data.refresh_token) : null;
    const result = await query<CalendarAccount>(
      `INSERT INTO calendar_accounts (
        provider,
        access_token,
        refresh_token,
        valid_from,
        valid_to,
        user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.provider,
        data.access_token,
        encryptedRefreshToken,
        data.valid_from,
        data.valid_to,
        data.user_id
      ]
    )
    console.log('Successfully created calendar account with ID:', result.rows[0].id)
    return result.rows[0]
  },

  // Get calendar accounts for a user
  async getByUserId(userId: string) {
    const result = await query<CalendarAccount>(
      'SELECT * FROM calendar_accounts WHERE user_id = $1 AND calendar_access = true',
      [userId]
    ).then(result => result.rows)

    // Decrypt refresh tokens for all accounts
    return result.map(account => {
      if (account.refresh_token) {
        try {
          account.refresh_token = decrypt(account.refresh_token)
        } catch (err) {
          throw new Error('Failed to decrypt refresh token: token is not encrypted or is corrupted')
        }
      }
      return account
    })
  },

  // Get a calendar account by ID
  async getById(id: string | number) {
    const result = await query<CalendarAccount>(
      'SELECT * FROM calendar_accounts WHERE id = $1',
      [id]
    )
    if (result.rows[0]) {
      // Decrypt the refresh token if it exists
      if (result.rows[0].refresh_token) {
        try {
          result.rows[0].refresh_token = decrypt(result.rows[0].refresh_token)
        } catch (err) {
          throw new Error('Failed to decrypt refresh token: token is not encrypted or is corrupted')
        }
      }
    }
    return result.rows[0]
  },

  // Update a calendar account (and encrypt the refresh token)
  async update(id: string | number, data: Partial<CalendarAccount>) {
    const encryptedRefreshToken = data.refresh_token ? encrypt(data.refresh_token) : null;
    const result = await query<CalendarAccount>(
      `UPDATE calendar_accounts
       SET provider = COALESCE($1, provider),
           access_token = COALESCE($2, access_token),
           refresh_token = COALESCE($3, refresh_token),
           valid_from = COALESCE($4, valid_from),
           valid_to = COALESCE($5, valid_to),
           user_id = COALESCE($6, user_id)
       WHERE id = $7
       RETURNING *`,
      [
        data.provider,
        data.access_token,
        encryptedRefreshToken,
        data.valid_from,
        data.valid_to,
        data.user_id,
        id
      ]
    )
    return result.rows[0]
  },

  // Delete a calendar account
  async delete(id: string | number) {
    console.log('Deleting calendar account with ID:', id);
    const result = await query<CalendarAccount>(
      'DELETE FROM calendar_accounts WHERE id = $1 RETURNING *',
      [id]
    );
    console.log('Delete result:', { 
      rowCount: result.rowCount,
      deletedId: result.rows[0]?.id 
    });
    return result.rows[0];
  }
};

export default pool 