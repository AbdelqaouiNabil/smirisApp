-- Germansphere SaaS Database Schema
-- PostgreSQL Database für deutsches Sprachlernen in Marokko

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Für geografische Daten

-- Benutzer-Tabelle
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student', 'tutor', 'school', 'admin'
  phone VARCHAR(20),
  avatar_url TEXT,
  location VARCHAR(100),
  language_preference VARCHAR(10) DEFAULT 'de', -- 'de', 'fr', 'ar'
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schulen-Tabelle
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  certifications TEXT[],
  features TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kurse-Tabelle
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  tutor_id INTEGER REFERENCES tutors(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  level VARCHAR(20) NOT NULL,        -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  category VARCHAR(50) DEFAULT 'general', -- 'general', 'business', 'exam_prep', 'conversation'
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  duration_weeks INTEGER,
  hours_per_week INTEGER,
  max_students INTEGER,
  enrolled_students INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  schedule VARCHAR(100),             -- e.g., "Mo, Mi, Fr 18:00-20:00"
  is_online BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutoren-Tabelle
CREATE TABLE tutors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  experience_years INTEGER,
  hourly_rate DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  specializations TEXT[],
  languages TEXT[],
  certifications TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 0,
  availability JSONB, -- Verfügbarkeitszeiten als JSON
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cv_file_path TEXT,
  certificate_files JSONB,
  photo_path TEXT
);

-- Buchungen-Tabelle
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  tutor_id INTEGER REFERENCES tutors(id) ON DELETE SET NULL,
  booking_type VARCHAR(20) NOT NULL, -- 'course', 'tutor', 'visa'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  start_date DATE,
  end_date DATE,
  time_slot VARCHAR(20), -- z.B. "14:00-16:00"
  duration_minutes INTEGER,
  total_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'MAD',
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  subject VARCHAR(200), -- Thema/Schwerpunkt der Buchung
  notes TEXT,
  meeting_link VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern VARCHAR(50), -- 'weekly', 'monthly'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visa-Services-Tabelle
CREATE TABLE visa_services (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  name VARCHAR(100) NOT NULL, -- z.B. "Übersetzung", "Visa-Beratung"
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  processing_time VARCHAR(50), -- z.B. "3-5 Werktage"
  required_documents TEXT[],
  category VARCHAR(50), -- 'translation', 'consultation', 'application'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zahlungen-Tabelle
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'bank_transfer'
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bewertungen-Tabelle
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nachrichten-Tabelle
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  message_type VARCHAR(20) DEFAULT 'general', -- 'general', 'booking', 'support'
  related_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für bessere Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_schools_location ON schools(location);
CREATE INDEX idx_schools_rating ON schools(rating);
CREATE INDEX idx_courses_school ON courses(school_id);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_reviews_school ON reviews(school_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Trigger für updated_at Felder
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views für häufige Abfragen
CREATE VIEW school_stats AS
SELECT 
  s.id,
  s.name,
  s.location,
  s.rating,
  s.review_count,
  COUNT(c.id) as total_courses,
  AVG(c.price) as avg_course_price,
  COUNT(DISTINCT b.student_id) as total_students
FROM schools s
LEFT JOIN courses c ON s.id = c.school_id
LEFT JOIN bookings b ON c.id = b.course_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.location, s.rating, s.review_count;

CREATE VIEW tutor_stats AS
SELECT 
  t.id,
  u.name,
  t.hourly_rate,
  t.rating,
  t.review_count,
  t.total_students,
  t.total_hours,
  t.experience_years
FROM tutors t
JOIN users u ON t.user_id = u.id
WHERE u.is_active = TRUE AND t.is_available = TRUE;

ALTER TABLE tutors ADD COLUMN photo_path TEXT;

-- Add subject column to bookings table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN subject VARCHAR(200);
    END IF;
END $$;