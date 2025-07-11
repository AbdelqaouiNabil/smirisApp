import fs from 'fs';
import path from 'path';
import { pool, testConnection } from './connection';

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initialisiere Germansphere-Datenbank...');

    // Datenbankverbindung testen
    const connectionResult = await testConnection();
    if (!connectionResult) {
      throw new Error('Datenbankverbindung fehlgeschlagen');
    }

    // Drop existing tables
    console.log('🗑️ Entferne bestehende Tabellen...');
    await pool.query(`
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS visa_services CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS tutors CASCADE;
      DROP TABLE IF EXISTS schools CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✅ Bestehende Tabellen entfernt');

    // Schema-Datei lesen
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Schema ausführen
    console.log('📋 Führe Datenbankschema aus...');
    await pool.query(schemaSQL);
    console.log('✅ Datenbankschema erfolgreich erstellt');

    // Test-Admin-Benutzer erstellen
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123!', 12);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         updated_at = CURRENT_TIMESTAMP`,
      ['Admin User', 'admin@germansphere.com', adminPassword, 'admin', true, true]
    );
    console.log('👤 Test-Admin-Benutzer erstellt (admin@germansphere.com / admin123!)');

    // Beispiel-Visa-Services erstellen
    const visaServices = [
      {
        name: 'Dokumentenübersetzung (Deutsch)',
        description: 'Beglaubigte Übersetzung Ihrer Dokumente ins Deutsche durch zertifizierte Übersetzer.',
        price: 150.00,
        processing_time: '3-5 Werktage',
        required_documents: ['Originaldokument', 'Kopie des Reisepasses'],
        category: 'translation'
      },
      {
        name: 'Visa-Beratung',
        description: 'Persönliche Beratung für Ihren Deutschland-Visa-Antrag durch erfahrene Experten.',
        price: 200.00,
        processing_time: '1 Werktag',
        required_documents: ['Reisepass', 'Finanznachweis', 'Einladungsschreiben'],
        category: 'consultation'
      },
      {
        name: 'Komplette Visa-Antragstellung',
        description: 'Wir übernehmen die komplette Abwicklung Ihres Visa-Antrags von A bis Z.',
        price: 500.00,
        processing_time: '2-3 Wochen',
        required_documents: ['Alle visa-relevanten Dokumente', 'Biometrische Fotos'],
        category: 'application'
      }
    ];

    for (const service of visaServices) {
      await pool.query(
        `INSERT INTO visa_services (name, description, price, processing_time, required_documents, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          service.name,
          service.description,
          service.price,
          service.processing_time,
          service.required_documents,
          service.category
        ]
      );
    }
    console.log('📄 Beispiel-Visa-Services erstellt');

    console.log('🎉 Datenbankinitialisierung abgeschlossen!');
    console.log('');
    console.log('📋 Nächste Schritte:');
    console.log('1. Starten Sie den Server: npm run dev');
    console.log('2. Loggen Sie sich als Admin ein: admin@germansphere.com / admin123!');
    console.log('3. Importieren Sie echte Schul- und Kursdaten');
    console.log('4. Konfigurieren Sie Stripe/PayPal für Zahlungen');

  } catch (error) {
    console.error('❌ Datenbankinitialisierung fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Skript ausführen, wenn direkt aufgerufen
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;