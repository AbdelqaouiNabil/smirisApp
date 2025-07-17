import express, { Request, Response } from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken, requireTutorOrAdmin, optionalAuth } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

const router = express.Router();

// Minimal test route to check if requests reach this router
router.post('/test-upload', (req, res) => {
  res.status(200).json({ message: 'Test route hit', headers: req.headers });
});

// Tutor Registration (creates both user and tutor profile)
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    // Parse JSON fields sent as strings (no file uploads)
    let specializations, languages, qualifications, preparesForExams, availableFormats;
    try {
      specializations = JSON.parse(req.body.specializations || '[]');
      languages = JSON.parse(req.body.languages || '[]');
      qualifications = JSON.parse(req.body.qualifications || '[]');
      preparesForExams = JSON.parse(req.body.preparesForExams || '[]');
      availableFormats = JSON.parse(req.body.availableFormats || '[]');
    } catch (e) {
      throw new AppError('Fehler beim Parsen der Array-Felder', 400);
    }

    // Manual validation for required fields
    const {
      firstName, lastName, email, phone, city, teachingExperience, hourlyRate,
      maxStudentsPerGroup, teachingPhilosophy, termsAccepted, dataProcessingAccepted
    } = req.body;

    if (!firstName || firstName.length < 2 || firstName.length > 50) {
      throw new AppError('Vorname muss zwischen 2 und 50 Zeichen lang sein', 400);
    }
    if (!lastName || lastName.length < 2 || lastName.length > 50) {
      throw new AppError('Nachname muss zwischen 2 und 50 Zeichen lang sein', 400);
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new AppError('Gültige E-Mail-Adresse erforderlich', 400);
    }
    if (!city || city.length < 2 || city.length > 100) {
      throw new AppError('Stadt muss zwischen 2 und 100 Zeichen lang sein', 400);
    }
    if (isNaN(Number(teachingExperience)) || Number(teachingExperience) < 0 || Number(teachingExperience) > 50) {
      throw new AppError('Erfahrungsjahre müssen zwischen 0 und 50 liegen', 400);
    }
    if (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 0) {
      throw new AppError('Stundensatz muss eine positive Zahl sein', 400);
    }
    if (!Array.isArray(specializations)) {
      throw new AppError('Spezialisierungen müssen ein Array sein', 400);
    }
    if (!Array.isArray(languages)) {
      throw new AppError('Sprachen müssen ein Array sein', 400);
    }
    if (!Array.isArray(qualifications)) {
      throw new AppError('Qualifikationen müssen ein Array sein', 400);
    }
    if (!Array.isArray(preparesForExams)) {
      throw new AppError('Prüfungsvorbereitungen müssen ein Array sein', 400);
    }
    if (!Array.isArray(availableFormats)) {
      throw new AppError('Verfügbare Formate müssen ein Array sein', 400);
    }
    if (isNaN(Number(maxStudentsPerGroup)) || Number(maxStudentsPerGroup) < 1 || Number(maxStudentsPerGroup) > 20) {
      throw new AppError('Maximale Studenten pro Gruppe muss zwischen 1 und 20 liegen', 400);
    }
    if (teachingPhilosophy && teachingPhilosophy.length > 1000) {
      throw new AppError('Lehrphilosophie zu lang', 400);
    }
    if (termsAccepted !== 'true' && termsAccepted !== true && termsAccepted !== 'on') {
      throw new AppError('Bedingungen müssen akzeptiert werden', 400);
    }
    if (dataProcessingAccepted !== 'true' && dataProcessingAccepted !== true && dataProcessingAccepted !== 'on') {
      throw new AppError('Datenverarbeitung muss akzeptiert werden', 400);
    }

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('E-Mail-Adresse ist bereits registriert', 409);
    }

    // Accept password from frontend if provided
    let password = req.body.password;
    let randomPasswordGenerated = false;
    if (!password || password.length < 6) {
      // Generate a random password if not provided or too short
      password = Math.random().toString(36).slice(-8);
      randomPasswordGenerated = true;
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const fullName = `${firstName} ${lastName}`;
    const userResult = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, uuid, name, email, role, created_at`,
      [fullName, email, passwordHash, 'tutor', phone, city]
    );

    const user = userResult.rows[0];

    // Save all certificate file paths as an array
    const certificatePaths: string[] = []; // No file paths to save here

    // Create tutor profile
    const tutorResult = await query(
      `INSERT INTO tutors (
        user_id, bio, experience_years, hourly_rate, currency, specializations,
        languages, certifications, availability, is_verified, is_available, profile_photo, cv_file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, user_id, bio, experience_years, hourly_rate, specializations,
                languages, certifications, rating, review_count, total_students,
                total_hours, availability, is_verified, created_at, profile_photo, cv_file_path`,
      [
        user.id,
        teachingPhilosophy || '',
        teachingExperience,
        hourlyRate,
        'EUR',
        specializations, // pass as array
        languages,       // pass as array
        qualifications,  // pass as array (for certifications)
        JSON.stringify({ formats: availableFormats, maxStudents: maxStudentsPerGroup, examPrep: preparesForExams }),
        false, // Not verified initially
        true,  // Available for bookings
        null, // No profile photo
        null // No cv file path
      ]
    );

    const tutor = tutorResult.rows[0];

    // TODO: Save certificates file paths if needed

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.status(201).json({
      message: 'Tutor-Registrierung erfolgreich',
      tutor: {
        ...tutor,
        name: user.name,
        email: user.email,
        location: city
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
      // Only return the password if it was randomly generated
      temporaryPassword: randomPasswordGenerated ? password : undefined
    });
  })
);

// Alle Tutoren abrufen (öffentlich)
router.get('/', [
  optionalAuth,
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl'),
  expressQuery('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Ungültiges Limit'),
  expressQuery('min_rate').optional().isFloat({ min: 0 }).withMessage('Ungültiger Mindestpreis'),
  expressQuery('max_rate').optional().isFloat({ min: 0 }).withMessage('Ungültiger Höchstpreis'),
  expressQuery('specialization').optional().trim().isLength({ max: 100 }),
  expressQuery('rating').optional().isFloat({ min: 0, max: 5 }),
  expressQuery('search').optional().trim().isLength({ max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const offset = (page - 1) * limit;
  const minRate = req.query.min_rate ? parseFloat(req.query.min_rate as string) : undefined;
  const maxRate = req.query.max_rate ? parseFloat(req.query.max_rate as string) : undefined;
  const specialization = req.query.specialization as string;
  const minRating = req.query.rating ? parseFloat(req.query.rating as string) : undefined;
  const searchTerm = req.query.search as string;

  // WHERE-Klauseln dynamisch aufbauen
  const whereConditions: string[] = ['u.is_active = TRUE', 't.is_available = TRUE'];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (minRate !== undefined) {
    whereConditions.push(`t.hourly_rate >= $${paramIndex++}`);
    queryParams.push(minRate);
  }

  if (maxRate !== undefined) {
    whereConditions.push(`t.hourly_rate <= $${paramIndex++}`);
    queryParams.push(maxRate);
  }

  if (specialization) {
    whereConditions.push(`$${paramIndex++} = ANY(t.specializations)`);
    queryParams.push(specialization);
  }

  if (minRating !== undefined) {
    whereConditions.push(`t.rating >= $${paramIndex++}`);
    queryParams.push(minRating);
  }

  if (searchTerm) {
    whereConditions.push(`(u.name ILIKE $${paramIndex++} OR t.bio ILIKE $${paramIndex} OR array_to_string(t.specializations, ' ') ILIKE $${paramIndex})`);
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    paramIndex++;
  }

  // Gesamtzahl der Tutoren
  const countResult = await query(
    `SELECT COUNT(*) 
     FROM tutors t
     JOIN users u ON t.user_id = u.id
     WHERE ${whereConditions.join(' AND ')}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Tutoren abrufen
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT 
      t.id, t.bio, t.experience_years, t.hourly_rate, t.currency, t.specializations,
      t.languages, t.certifications, t.rating, t.review_count, t.total_students,
      t.total_hours, t.availability, t.is_verified, t.created_at,
      u.id as user_id, u.name, u.email, u.avatar_url, u.location
     FROM tutors t
     JOIN users u ON t.user_id = u.id
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY t.rating DESC, t.review_count DESC, t.total_students DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  res.json({
    tutors: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}));

// Get tutor by tutor table ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const tutorId = parseInt(req.params.id);
  if (isNaN(tutorId)) throw validationError('Ungültige Tutor-ID');
  const result = await query('SELECT * FROM tutors WHERE id = $1', [tutorId]);
  if (result.rows.length === 0) throw new AppError('Tutor nicht gefunden', 404);
  res.json({ tutor: result.rows[0] });
}));

// Tutor-Profil erstellen
router.post('/profile', [
  authenticateToken,
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio zu lang'),
  body('experience_years')
    .isInt({ min: 0, max: 50 })
    .withMessage('Erfahrungsjahre müssen zwischen 0 und 50 liegen'),
  body('hourly_rate')
    .isFloat({ min: 0 })
    .withMessage('Stundensatz muss eine positive Zahl sein'),
  body('specializations')
    .isArray()
    .withMessage('Spezialisierungen müssen ein Array sein'),
  body('languages')
    .isArray()
    .withMessage('Sprachen müssen ein Array sein'),
  body('availability')
    .isObject()
    .withMessage('Verfügbarkeit muss ein Objekt sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  // Prüfen, ob bereits ein Tutor-Profil existiert
  const existingProfile = await query(
    'SELECT id FROM tutors WHERE user_id = $1',
    [req.user!.id]
  );

  if (existingProfile.rows.length > 0) {
    throw new AppError('Tutor-Profil existiert bereits', 409);
  }

  const {
    bio, experience_years, hourly_rate, currency = 'EUR', specializations,
    languages, certifications, availability
  } = req.body;

  const result = await query(
    `INSERT INTO tutors 
     (user_id, bio, experience_years, hourly_rate, currency, specializations,
      languages, certifications, availability)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      req.user!.id, bio, experience_years, hourly_rate, currency,
      specializations, languages, certifications, JSON.stringify(availability)
    ]
  );

  // Benutzerrolle auf 'tutor' setzen
  await query(
    'UPDATE users SET role = $1 WHERE id = $2',
    ['tutor', req.user!.id]
  );

  res.status(201).json({
    message: 'Tutor-Profil erfolgreich erstellt',
    tutor: result.rows[0]
  });
}));

// Tutor-Profil aktualisieren
router.put('/profile', [
  authenticateToken,
  requireTutorOrAdmin,
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio zu lang'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stundensatz muss eine positive Zahl sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  // Tutor-Profil finden
  const tutorResult = await query(
    'SELECT id, user_id FROM tutors WHERE user_id = $1',
    [req.user!.id]
  );

  if (tutorResult.rows.length === 0) {
    throw new AppError('Tutor-Profil nicht gefunden', 404);
  }

  const tutorId = tutorResult.rows[0].id;

  const {
    bio, experience_years, hourly_rate, currency, specializations,
    languages, certifications, availability
  } = req.body;

  // Dynamisches Update
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = {
    bio, experience_years, hourly_rate, currency, specializations,
    languages, certifications, 
    availability: availability ? JSON.stringify(availability) : undefined
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    throw validationError('Keine Aktualisierungen angegeben');
  }

  values.push(tutorId);

  const result = await query(
    `UPDATE tutors 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  res.json({
    message: 'Tutor-Profil erfolgreich aktualisiert',
    tutor: result.rows[0]
  });
}));

// Tutor buchen
router.post('/:id/book', [
  authenticateToken,
  body('start_date')
    .isISO8601()
    .withMessage('Ungültiges Startdatum'),
  body('time_slot')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Ungültiger Zeitslot (Format: HH:MM-HH:MM)'),
  body('duration_minutes')
    .isInt({ min: 30, max: 480 })
    .withMessage('Dauer muss zwischen 30 und 480 Minuten liegen'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Thema zu lang'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notizen zu lang')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const tutorId = parseInt(req.params.id);
  if (isNaN(tutorId)) {
    throw validationError('Ungültige Tutor-ID');
  }

  const { start_date, time_slot, duration_minutes, subject, notes } = req.body;

  // Tutor abrufen
  const tutorResult = await query(
    `SELECT t.id, t.hourly_rate, t.is_available, u.name
     FROM tutors t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = $1 AND u.is_active = TRUE`,
    [tutorId]
  );

  if (tutorResult.rows.length === 0) {
    throw new AppError('Tutor nicht gefunden', 404);
  }

  const tutor = tutorResult.rows[0];
  if (!tutor.is_available) {
    throw new AppError('Tutor ist derzeit nicht verfügbar', 409);
  }

  // Prüfen, ob der Zeitslot bereits gebucht ist
  const conflictResult = await query(
    `SELECT id FROM bookings 
     WHERE tutor_id = $1 AND start_date = $2 AND time_slot = $3 
       AND status IN ('pending', 'confirmed')`,
    [tutorId, start_date, time_slot]
  );

  if (conflictResult.rows.length > 0) {
    throw new AppError('Dieser Zeitslot ist bereits gebucht', 409);
  }

  // Preis berechnen
  const hourlyRate = parseFloat(tutor.hourly_rate);
  const hours = duration_minutes / 60;
  const totalPrice = hourlyRate * hours;

  // Buchung erstellen
  const bookingResult = await query(
    `INSERT INTO bookings 
     (student_id, tutor_id, booking_type, start_date, time_slot, duration_minutes, 
      total_price, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      req.user!.id, tutorId, 'tutor', start_date, time_slot, 
      duration_minutes, totalPrice, notes
    ]
  );

  res.status(201).json({
    message: 'Tutor erfolgreich gebucht',
    booking: bookingResult.rows[0],
    totalPrice
  });
}));

// Bewertung für Tutor hinzufügen
router.post('/:id/reviews', [
  authenticateToken,
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Bewertung muss zwischen 1 und 5 liegen'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Titel zu lang'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Kommentar zu lang')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const tutorId = parseInt(req.params.id);
  if (isNaN(tutorId)) {
    throw validationError('Ungültige Tutor-ID');
  }

  const { rating, title, comment } = req.body;

  // Prüfen, ob Tutor existiert
  const tutorExists = await query(
    'SELECT id FROM tutors WHERE id = $1 AND is_available = TRUE',
    [tutorId]
  );
  if (tutorExists.rows.length === 0) {
    throw new AppError('Tutor nicht gefunden', 404);
  }

  // Prüfen, ob der Benutzer eine Stunde beim Tutor gebucht hatte
  const hasBooking = await query(
    `SELECT id FROM bookings 
     WHERE student_id = $1 AND tutor_id = $2 AND status = 'completed'`,
    [req.user!.id, tutorId]
  );

  if (hasBooking.rows.length === 0) {
    throw new AppError('Sie können nur Tutoren bewerten, bei denen Sie eine Stunde genommen haben', 403);
  }

  // Prüfen, ob bereits eine Bewertung existiert
  const existingReview = await query(
    'SELECT id FROM reviews WHERE user_id = $1 AND tutor_id = $2',
    [req.user!.id, tutorId]
  );
  if (existingReview.rows.length > 0) {
    throw new AppError('Sie haben bereits eine Bewertung für diesen Tutor abgegeben', 409);
  }

  // Bewertung hinzufügen
  const result = await query(
    `INSERT INTO reviews (user_id, tutor_id, rating, title, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user!.id, tutorId, rating, title, comment]
  );

  // Tutor-Rating und Review-Count aktualisieren
  await query(
    `UPDATE tutors 
     SET rating = (
       SELECT AVG(rating) FROM reviews WHERE tutor_id = $1 AND is_public = TRUE
     ),
     review_count = (
       SELECT COUNT(*) FROM reviews WHERE tutor_id = $1 AND is_public = TRUE
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [tutorId]
  );

  res.status(201).json({
    message: 'Bewertung erfolgreich hinzugefügt',
    review: result.rows[0]
  });
}));

// Fetch tutor by user_id
router.get('/by-user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) throw validationError('Ungültige User-ID');
  const result = await query(
    `SELECT * FROM tutors WHERE user_id = $1`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError('Tutor nicht gefunden', 404);
  res.json({ tutor: result.rows[0] });
}));

// Update tutor availability
router.post('/availability', [
  authenticateToken,
  requireTutorOrAdmin,
  body('availability').isObject().withMessage('Verfügbarkeit muss ein Objekt sein'),
  body('availability.weeklySchedule').isObject().withMessage('Wochenplan muss ein Objekt sein'),
  body('availability.exceptions').optional().isArray().withMessage('Ausnahmen müssen ein Array sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Eingabedaten');
  }

  const { availability } = req.body;
  const userId = req.user!.id;

  // Get tutor ID from user ID
  const tutorResult = await query(
    'SELECT id FROM tutors WHERE user_id = $1',
    [userId]
  );

  if (tutorResult.rows.length === 0) {
    throw new AppError('Tutor nicht gefunden', 404);
  }

  const tutorId = tutorResult.rows[0].id;

  // Update availability
  await query(
    `UPDATE tutors 
     SET availability = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [availability, tutorId]
  );

  res.json({
    message: 'Verfügbarkeit erfolgreich aktualisiert',
    availability
  });
}));

// Get current tutor's availability
router.get('/me/availability', [
  authenticateToken,
  requireTutorOrAdmin
], asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await query(
    `SELECT availability 
     FROM tutors 
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tutor nicht gefunden', 404);
  }

  res.json({
    availability: result.rows[0].availability
  });
}));

// Create a separate router for profile documents upload
export const profileDocumentsRouter = express.Router();

profileDocumentsRouter.post(
  '/profile-documents',
  authenticateToken,
  (req, res, next) => {
    console.log('Starting file upload...');
    console.log('Request content-type:', req.headers['content-type']);
    upload.fields([
      { name: 'photo', maxCount: 1 },
      { name: 'cv', maxCount: 1 },
      { name: 'certificates', maxCount: 10 }
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: 'Upload error: ' + err.message });
      }
      console.log('Multer processing completed successfully');
      console.log('Files after multer:', req.files);
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    // Use req.user!.id as the tutorId
    const userId = req.user!.id;
    const files = req.files as Record<string, Express.Multer.File[]>;
    
    console.log('=== DETAILED FILE ANALYSIS ===');
    console.log('Files received:', files);
    console.log('User ID:', userId);
    
    // Check each field specifically
    console.log('Photo field:', files?.photo);
    console.log('CV field:', files?.cv);
    console.log('Certificates field:', files?.certificates);
    
    const photo = files?.photo?.[0]?.path || null;
    const cv = files?.cv?.[0]?.path || null;
    const certificates = (files?.certificates || []).map(f => f.path);
    
    console.log('Extracted photo path:', photo);
    console.log('Extracted CV path:', cv);
    console.log('Extracted certificate paths:', certificates);
    
    // Check if files actually exist on disk
    if (photo && fs.existsSync(photo)) {
      console.log('✅ Photo file exists on disk:', photo);
    } else {
      console.log('❌ Photo file does not exist on disk:', photo);
    }
    
    if (cv && fs.existsSync(cv)) {
      console.log('✅ CV file exists on disk:', cv);
    } else {
      console.log('❌ CV file does not exist on disk:', cv);
    }
    
    certificates.forEach((cert, index) => {
      if (fs.existsSync(cert)) {
        console.log(`✅ Certificate ${index} exists on disk:`, cert);
      } else {
        console.log(`❌ Certificate ${index} does not exist on disk:`, cert);
      }
    });
    
    // Check if tutor record exists
    const tutorCheck = await query('SELECT id FROM tutors WHERE user_id = $1', [userId]);
    if (tutorCheck.rows.length === 0) {
      throw new AppError('Tutor record not found for this user', 404);
    }
    
    const updateResult = await query(
      'UPDATE tutors SET profile_photo = $1, cv_file_path = $2, certificate_files = $3 WHERE user_id = $4 RETURNING id',
      [photo, cv, JSON.stringify(certificates), userId]
    );
    
    console.log('Database update result:', updateResult.rows);
    
    res.status(200).json({ 
      message: 'Profil-Dokumente erfolgreich hochgeladen', 
      photo, 
      cv, 
      certificates,
      tutorId: updateResult.rows[0]?.id 
    });
  })
);

export default router;