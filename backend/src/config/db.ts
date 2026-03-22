import { Pool } from '@neondatabase/serverless';
import { QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is missing in backend/.env');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export const db = {
  query: async <T extends import('pg').QueryResultRow = any>(
    text: string, 
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const client = await pool.connect();
    
    try {
      const result = await client.query<T>(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};