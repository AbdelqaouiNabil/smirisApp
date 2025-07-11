import { pool } from './connection';

const addSubjectColumn = async () => {
  try {
    console.log('🔄 Adding subject column to bookings table...');
    
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS subject VARCHAR(200);
    `);
    
    console.log('✅ Subject column added successfully');
  } catch (error) {
    console.error('❌ Failed to add subject column:', error);
  } finally {
    await pool.end();
  }
};

// Run the script
addSubjectColumn(); 