import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'germansphere',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // Maximale Anzahl von Verbindungen im Pool
  idleTimeoutMillis: 30000, // Zeit bevor eine leere Verbindung geschlossen wird
  connectionTimeoutMillis: 2000, // Zeit bevor eine neue Verbindung aufgegeben wird
};

// PostgreSQL Connection Pool
export const pool = new Pool(poolConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL Datenbankverbindung erfolgreich');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL Datenbankverbindung fehlgeschlagen:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Schließe Datenbankverbindungen...');
  pool.end(() => {
    console.log('✅ Datenbankverbindungen geschlossen');
    process.exit(0);
  });
});

// Query helper function
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text} - Duration: ${duration}ms - Rows: ${result.rowCount}`);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;