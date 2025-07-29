import fs from 'fs';
import path from 'path';
import { pool } from './connection';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding Germansphere-Datenbank mit Beispieldaten...');

    // Beispiel-Schulen erstellen
    const schools = [
      {
        name: 'Deutschzentrum Casablanca',
        description: 'Führendes Zentrum für deutsche Sprache in Casablanca mit über 10 Jahren Erfahrung.',
        location: 'Casablanca',
        address: 'Boulevard Mohammed V, Casablanca 20000',
        latitude: 33.5731,
        longitude: -7.5898,
        phone: '+212 522 123 456',
        email: 'info@deutschzentrum-casa.ma',
        website: 'https://deutschzentrum-casa.ma',
        certifications: ['Goethe-Institut Partner', 'TestDaF Zentrum', 'BAMF anerkannt'],
        features: ['Kleine Klassen', 'Muttersprachliche Lehrer', 'Kulturprogramm', 'Prüfungszentrum']
      },
      {
        name: 'Institut Allemand Rabat',
        description: 'Traditionelle deutsche Sprachschule im Herzen von Rabat.',
        location: 'Rabat',
        address: 'Avenue Allal Ben Abdellah, Rabat 10000',
        latitude: 34.0209,
        longitude: -6.8416,
        phone: '+212 537 765 432',
        email: 'contact@institut-allemand-rabat.ma',
        website: 'https://institut-allemand-rabat.ma',
        certifications: ['ISO 9001', 'Goethe-Institut Partner'],
        features: ['Intensivkurse', 'Business Deutsch', 'Online-Unterricht', 'Flexibles Lernen']
      },
      {
        name: 'German Language Academy Marrakech',
        description: 'Moderne Sprachschule in Marrakech mit innovativen Lehrmethoden.',
        location: 'Marrakech',
        address: 'Gueliz, Marrakech 40000',
        latitude: 31.6295,
        longitude: -7.9811,
        phone: '+212 524 987 654',
        email: 'info@gla-marrakech.ma',
        website: 'https://gla-marrakech.ma',
        certifications: ['Cambridge Assessment', 'European Framework'],
        features: ['Multimedia-Ausstattung', 'Kulturelle Aktivitäten', 'Sprachaustausch', 'Zertifikatskurse']
      }
    ];

    // Schulen einfügen und IDs speichern
    const schoolIds: number[] = [];
    for (const school of schools) {
      const result = await pool.query(
        `INSERT INTO schools 
         (name, description, location, address, latitude, longitude, phone, email, 
          website, certifications, features, rating, review_count, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          school.name, school.description, school.location, school.address,
          school.latitude, school.longitude, school.phone, school.email,
          school.website, school.certifications, school.features,
          4.5 + Math.random() * 0.5, // Rating zwischen 4.5 und 5.0
          Math.floor(Math.random() * 100) + 20, // Reviews zwischen 20 und 120
          true
        ]
      );
      schoolIds.push(result.rows[0].id);
    }
    console.log(`✅ ${schools.length} Beispiel-Schulen erstellt`);

    // Kurse für jede Schule erstellen
    const courseLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const courseCategories = ['general', 'business', 'exam_prep', 'conversation'];
    let courseCount = 0;

    for (const schoolId of schoolIds) {
      for (const level of courseLevels) {
        for (const category of courseCategories) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) + 1);
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + (8 * 7)); // 8 Wochen

          const basePrice = {
            'A1': 1500, 'A2': 1600, 'B1': 1700, 'B2': 1800, 'C1': 1900, 'C2': 2000
          }[level] || 1500;

          const categoryMultiplier = {
            'general': 1.0, 'business': 1.3, 'exam_prep': 1.2, 'conversation': 0.9
          }[category] || 1.0;

          const price = Math.round(basePrice * categoryMultiplier);

          await pool.query(
            `INSERT INTO courses 
             (school_id, title, description, level, category, price, duration_weeks,
              hours_per_week, max_students, enrolled_students, start_date, end_date,
              schedule, is_online)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              schoolId,
              `Deutsch ${level} - ${category === 'general' ? 'Allgemein' : 
                category === 'business' ? 'Business' : 
                category === 'exam_prep' ? 'Prüfungsvorbereitung' : 'Konversation'}`,
              `Intensivkurs für das Sprachniveau ${level} mit Fokus auf ${category}.`,
              level,
              category,
              price,
              8, // 8 Wochen
              Math.floor(Math.random() * 10) + 6, // 6-15 Stunden pro Woche
              Math.floor(Math.random() * 10) + 8, // 8-17 max Studenten
              Math.floor(Math.random() * 5), // 0-4 bereits eingeschrieben
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              'Mo, Mi, Fr 18:00-20:00',
              Math.random() > 0.7 // 30% Online-Kurse
            ]
          );
          courseCount++;
        }
      }
    }
    console.log(`✅ ${courseCount} Beispiel-Kurse erstellt`);

    // Beispiel-Studenten erstellen
    const students = [
      { name: 'Ahmed Hassan', email: 'ahmed.hassan@email.com' },
      { name: 'Fatima Zahra', email: 'fatima.zahra@email.com' },
      { name: 'Mohamed Bennani', email: 'mohamed.bennani@email.com' },
      { name: 'Aicha Alami', email: 'aicha.alami@email.com' },
      { name: 'Youssef Idrissi', email: 'youssef.idrissi@email.com' }
    ];

    const bcrypt = await import('bcryptjs');
    const studentPassword = await bcrypt.hash('student123', 12);

    for (const student of students) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, location, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [student.name, student.email, studentPassword, 'student', 'Casablanca', true]
      );
    }
    console.log(`✅ ${students.length} Beispiel-Studenten erstellt`);

    // Beispiel-Tutoren erstellen
    const tutors = [
      {
        name: 'Dr. Maria Schmidt',
        email: 'maria.schmidt@tutors.de',
        bio: 'Erfahrene Deutschlehrerin mit 15 Jahren Unterrichtserfahrung. Spezialisiert auf Business Deutsch.',
        experience_years: 15,
        hourly_rate: 35.00,
        specializations: ['Business Deutsch', 'Prüfungsvorbereitung', 'Konversation'],
        languages: ['Deutsch', 'Englisch', 'Französisch'],
        certifications: ['DaF/DaZ Zertifikat', 'Goethe-Institut Fortbildung']
      },
      {
        name: 'Thomas Müller',
        email: 'thomas.mueller@tutors.de',
        bio: 'Muttersprachler aus Deutschland mit Fokus auf praktische Kommunikation und Alltagssprache.',
        experience_years: 8,
        hourly_rate: 28.00,
        specializations: ['Konversation', 'Alltagsdeutsch', 'Aussprache'],
        languages: ['Deutsch', 'Englisch', 'Arabisch'],
        certifications: ['TESOL Zertifikat', 'DaF Ausbildung']
      },
      {
        name: 'Dr. Lisa Weber',
        email: 'lisa.weber@tutors.de',
        bio: 'Universitätsdozentin mit Expertise in deutscher Grammatik und Literatur.',
        experience_years: 12,
        hourly_rate: 40.00,
        specializations: ['Grammatik', 'Literatur', 'Akademisches Schreiben', 'C1/C2 Niveau'],
        languages: ['Deutsch', 'Englisch', 'Spanisch'],
        certifications: ['PhD Germanistik', 'DaF/DaZ Master']
      }
    ];

    const tutorPassword = await bcrypt.hash('tutor123', 12);

    for (const tutor of tutors) {
      // Benutzer erstellen
      const userResult = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, location, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [tutor.name, tutor.email, tutorPassword, 'tutor', 'Deutschland', true]
      );

      const userId = userResult.rows[0].id;

      // Tutor-Profil erstellen
      await pool.query(
        `INSERT INTO tutors 
         (user_id, bio, experience_years, hourly_rate, specializations, languages, 
          certifications, rating, review_count, total_students, is_verified, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
        [
          userId, tutor.bio, tutor.experience_years, tutor.hourly_rate,
          tutor.specializations, tutor.languages, tutor.certifications,
          4.6 + Math.random() * 0.4, // Rating zwischen 4.6 und 5.0
          Math.floor(Math.random() * 50) + 10, // Reviews zwischen 10 und 60
          Math.floor(Math.random() * 100) + 20, // Studenten zwischen 20 und 120
          true, true
        ]
      );
    }
    console.log(`✅ ${tutors.length} Beispiel-Tutoren erstellt`);

    // Beispiel-Buchungen erstellen
    const bookingCount = 15;
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    
    for (let i = 0; i < bookingCount; i++) {
      const studentResult = await pool.query(
        'SELECT id FROM users WHERE role = $1 ORDER BY RANDOM() LIMIT 1',
        ['student']
      );

      if (studentResult.rows.length === 0) continue;

      const studentId = studentResult.rows[0].id;
      const bookingType = Math.random() > 0.5 ? 'course' : 'tutor';
      
      if (bookingType === 'course') {
        const courseResult = await pool.query(
          'SELECT id, price FROM courses ORDER BY RANDOM() LIMIT 1'
        );
        
        if (courseResult.rows.length > 0) {
          const course = courseResult.rows[0];
          await pool.query(
            `INSERT INTO bookings 
             (student_id, course_id, booking_type, status, start_date, end_date, 
              total_price, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              studentId, course.id, bookingType,
              statuses[Math.floor(Math.random() * statuses.length)],
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +60 Tage
              course.price,
              Math.random() > 0.5 ? 'paid' : 'pending'
            ]
          );
        }
      } else {
        const tutorResult = await pool.query(
          'SELECT id, hourly_rate FROM tutors ORDER BY RANDOM() LIMIT 1'
        );
        
        if (tutorResult.rows.length > 0) {
          const tutor = tutorResult.rows[0];
          const duration = 60 + Math.floor(Math.random() * 60); // 60-120 Minuten
          const price = (tutor.hourly_rate * duration / 60);
          
          await pool.query(
            `INSERT INTO bookings 
             (student_id, tutor_id, booking_type, status, start_date, time_slot,
              duration_minutes, total_price, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              studentId, tutor.id, bookingType,
              statuses[Math.floor(Math.random() * statuses.length)],
              new Date().toISOString().split('T')[0],
              '14:00-16:00',
              duration, price,
              Math.random() > 0.5 ? 'paid' : 'pending'
            ]
          );
        }
      }
    }
    console.log(`✅ ${bookingCount} Beispiel-Buchungen erstellt`);

    // Beispiel-Tutor-Bewertungen erstellen
    const reviewCount = 20;
    const reviewComments = [
      'Sehr guter Tutor, erklärt alles sehr verständlich.',
      'Hervorragende Unterrichtsmethode, kann ich nur empfehlen.',
      'Sehr geduldig und professionell.',
      'Hat mir sehr geholfen, meine Deutschkenntnisse zu verbessern.',
      'Flexibel und anpassungsfähig an meine Bedürfnisse.',
      'Sehr strukturierter Unterricht, macht Spaß zu lernen.',
      'Kompetent und freundlich, sehr zu empfehlen.',
      'Hat mir bei der Prüfungsvorbereitung sehr geholfen.',
      'Sehr motivierend und unterstützend.',
      'Professioneller Unterricht mit modernen Methoden.'
    ];
    
    for (let i = 0; i < reviewCount; i++) {
      const studentResult = await pool.query(
        'SELECT id FROM users WHERE role = $1 ORDER BY RANDOM() LIMIT 1',
        ['student']
      );

      const tutorResult = await pool.query(
        'SELECT id FROM tutors ORDER BY RANDOM() LIMIT 1'
      );

      if (studentResult.rows.length > 0 && tutorResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;
        const tutorId = tutorResult.rows[0].id;
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 Sterne
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
        
        await pool.query(
          `INSERT INTO reviews 
           (user_id, tutor_id, rating, comment, is_verified, is_public)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [studentId, tutorId, rating, comment, true, true]
        );
      }
    }
    console.log(`✅ ${reviewCount} Beispiel-Tutor-Bewertungen erstellt`);

    console.log('🎉 Datenbank-Seeding abgeschlossen!');
    console.log('');
    console.log('🔑 Test-Zugangsdaten:');
    console.log('Admin: admin@germansphere.com / admin123!');
    console.log('Student: ahmed.hassan@email.com / student123');
    console.log('Tutor: maria.schmidt@tutors.de / tutor123');

  } catch (error) {
    console.error('❌ Datenbank-Seeding fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Skript ausführen, wenn direkt aufgerufen
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;