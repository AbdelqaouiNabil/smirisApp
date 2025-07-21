import express, { Request, Response } from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken, requireSchoolOrAdmin, optionalAuth, requireTutorOrAdmin } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Alle Kurse abrufen (öffentlich)
router.get('/', [
  optionalAuth,
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl'),
  expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Ungültiges Limit'),
  expressQuery('level').optional().isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).withMessage('Ungültiges Level'),
  expressQuery('category').optional().isIn(['general', 'business', 'exam_prep', 'conversation']).withMessage('Ungültige Kategorie'),
  expressQuery('school_id').optional().isInt().withMessage('Ungültige Schul-ID'),
  expressQuery('tutor_id').optional().isInt().withMessage('Ungültige Tutor-ID'),
  expressQuery('min_price').optional().isFloat({ min: 0 }).withMessage('Ungültiger Mindestpreis'),
  expressQuery('max_price').optional().isFloat({ min: 0 }).withMessage('Ungültiger Höchstpreis'),
  expressQuery('is_online').optional().isBoolean().withMessage('Ungültiger Online-Parameter'),
  expressQuery('search').optional().trim().isLength({ max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Filter-Parameter
  const level = req.query.level as string;
  const category = req.query.category as string;
  const schoolId = req.query.school_id ? parseInt(req.query.school_id as string) : undefined;
  const tutorId = req.query.tutor_id ? parseInt(req.query.tutor_id as string) : undefined;
  const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;
  const isOnline = req.query.is_online === 'true' ? true : req.query.is_online === 'false' ? false : undefined;
  const searchTerm = req.query.search as string;

  // WHERE-Klauseln dynamisch aufbauen
  const whereConditions: string[] = ['c.is_active = TRUE'];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (level) {
    whereConditions.push(`c.level = $${paramIndex++}`);
    queryParams.push(level);
  }

  if (category) {
    whereConditions.push(`c.category = $${paramIndex++}`);
    queryParams.push(category);
  }

  if (schoolId) {
    whereConditions.push(`c.school_id = $${paramIndex++}`);
    queryParams.push(schoolId);
  }

  if (tutorId) {
    whereConditions.push(`c.tutor_id = $${paramIndex++}`);
    queryParams.push(tutorId);
  }

  if (minPrice !== undefined) {
    whereConditions.push(`c.price >= $${paramIndex++}`);
    queryParams.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereConditions.push(`c.price <= $${paramIndex++}`);
    queryParams.push(maxPrice);
  }

  if (isOnline !== undefined) {
    whereConditions.push(`c.is_online = $${paramIndex++}`);
    queryParams.push(isOnline);
  }

  if (searchTerm) {
    whereConditions.push(`(
      c.title ILIKE $${paramIndex} OR 
      c.description ILIKE $${paramIndex} OR 
      COALESCE(s.name, '') ILIKE $${paramIndex} OR
      COALESCE(u.name, '') ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${searchTerm}%`);
    paramIndex++;
  }

  // Gesamtzahl der Kurse
  const countResult = await query(
    `SELECT COUNT(*) 
     FROM courses c
     LEFT JOIN schools s ON c.school_id = s.id
     LEFT JOIN tutors t ON c.tutor_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE ${whereConditions.join(' AND ')}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Kurse abrufen
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT 
      c.id, c.uuid, c.title, c.description, c.level, c.category, c.price, c.currency,
      c.duration_weeks, c.hours_per_week, c.max_students, c.enrolled_students,
      c.start_date, c.end_date, c.schedule, c.is_online, c.image_url, c.created_at,
      s.id as school_id, s.name as school_name, s.location as school_location,
      s.rating as school_rating, s.image_url as school_image,
      t.id as tutor_id, u.name as tutor_name, t.rating as tutor_rating,
      u.avatar_url as tutor_image
     FROM courses c
     LEFT JOIN schools s ON c.school_id = s.id
     LEFT JOIN tutors t ON c.tutor_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY c.start_date ASC, c.price ASC, c.title ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  res.json({
    courses: result.rows,
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

// Einzelnen Kurs abrufen
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  const result = await query(
    `SELECT 
      c.*, 
      s.name as school_name, s.location as school_location, s.phone as school_phone,
      s.email as school_email, s.website as school_website, s.rating as school_rating,
      s.image_url as school_image
     FROM courses c
     JOIN schools s ON c.school_id = s.id
     WHERE c.id = $1 AND c.is_active = TRUE AND s.is_active = TRUE`,
    [courseId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }

  const course = result.rows[0];

  // Ähnliche Kurse abrufen
  const similarResult = await query(
    `SELECT 
      c.id, c.title, c.level, c.price, c.duration_weeks, c.start_date,
      s.name as school_name, s.location as school_location
     FROM courses c
     JOIN schools s ON c.school_id = s.id
     WHERE c.level = $1 AND c.id != $2 AND c.is_active = TRUE AND s.is_active = TRUE
     ORDER BY c.start_date ASC
     LIMIT 5`,
    [course.level, courseId]
  );

  res.json({
    course,
    similarCourses: similarResult.rows
  });
}));

// Neuen Kurs erstellen
router.post('/', [
  authenticateToken,
  requireSchoolOrAdmin,
  body('school_id')
    .isInt()
    .withMessage('Schul-ID erforderlich'),
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Kurstitel muss zwischen 2 und 200 Zeichen lang sein'),
  body('level')
    .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    .withMessage('Ungültiges Kurslevel'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Preis muss eine positive Zahl sein'),
  body('duration_weeks')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Kursdauer muss zwischen 1 und 52 Wochen liegen'),
  body('max_students')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximale Teilnehmerzahl muss zwischen 1 und 100 liegen'),
  body('start_date')
    .isISO8601()
    .withMessage('Ungültiges Startdatum'),
  body('category')
    .optional()
    .isIn(['general', 'business', 'exam_prep', 'conversation'])
    .withMessage('Ungültige Kategorie')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const {
    school_id, title, description, level, category = 'general', price, currency = 'MAD',
    duration_weeks, hours_per_week, max_students, start_date, end_date, schedule,
    is_online = false
  } = req.body;

  // Berechtigung prüfen (Schule kann nur ihre eigenen Kurse erstellen)
  if (req.user!.role === 'school') {
    const schoolResult = await query(
      'SELECT owner_id FROM schools WHERE id = $1',
      [school_id]
    );
    
    if (schoolResult.rows.length === 0) {
      throw new AppError('Schule nicht gefunden', 404);
    }
    
    if (schoolResult.rows[0].owner_id !== req.user!.id) {
      throw new AppError('Keine Berechtigung Kurse für diese Schule zu erstellen', 403);
    }
  }

  const result = await query(
    `INSERT INTO courses 
     (school_id, title, description, level, category, price, currency, duration_weeks,
      hours_per_week, max_students, start_date, end_date, schedule, is_online)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      school_id, title, description, level, category, price, currency,
      duration_weeks, hours_per_week, max_students, start_date, end_date, schedule, is_online
    ]
  );

  res.status(201).json({
    message: 'Kurs erfolgreich erstellt',
    course: result.rows[0]
  });
}));

// Tutor erstellt neuen Kurs
router.post('/tutor', [
  authenticateToken,
  requireTutorOrAdmin,
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Kurstitel muss zwischen 2 und 200 Zeichen lang sein'),
  body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).withMessage('Ungültiges Kurslevel'),
  body('category').isIn(['general', 'business', 'exam_prep', 'conversation']).withMessage('Ungültige Kategorie'),
  body('price').isFloat({ min: 0 }).withMessage('Preis muss eine positive Zahl sein'),
  body('duration_weeks').optional().isInt({ min: 1, max: 52 }),
  body('hours_per_week').optional().isInt({ min: 1, max: 40 }),
  body('max_students').optional().isInt({ min: 1, max: 100 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('is_online').optional().isBoolean(),
  body('description').optional().isString(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Eingabedaten: ' + errors.array().map(e => e.msg).join(', '));
  }

  const {
    title, level, category, price, duration_weeks, hours_per_week, max_students,
    start_date, end_date, is_online, description
  } = req.body;

  // Find the tutor's ID for the logged-in user
  const tutorResult = await query('SELECT id, is_verified FROM tutors WHERE user_id = $1', [req.user!.id]);
  if (tutorResult.rows.length === 0) {
    throw new AppError('Tutor-Profil nicht gefunden', 404);
  }
  const tutor = tutorResult.rows[0];

  // Check if tutor is verified
  if (!tutor.is_verified) {
    throw new AppError('Sie müssen verifiziert werden, bevor Sie Kurse erstellen können. Bitte vervollständigen Sie Ihr Profil und warten Sie auf die Verifizierung.', 403);
  }
  const tutorId = tutor.id;

  // Insert new course for this tutor
  const result = await query(
    `INSERT INTO courses (
      title, level, category, price, duration_weeks, hours_per_week, max_students,
      start_date, end_date, is_online, description, tutor_id, is_active, currency
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, 'MAD')
    RETURNING *`,
    [
      title, level, category, price, duration_weeks || 1, hours_per_week || 1, max_students || 1,
      start_date, end_date, is_online ?? true, description || '', tutorId
    ]
  );

  res.status(201).json({ course: result.rows[0] });
}));

// Kurs aktualisieren
router.put('/:id', [
  authenticateToken,
  requireSchoolOrAdmin,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Kurstitel muss zwischen 2 und 200 Zeichen lang sein'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preis muss eine positive Zahl sein'),
  body('max_students')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximale Teilnehmerzahl muss zwischen 1 und 100 liegen')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  // Berechtigung prüfen
  const courseResult = await query(
    `SELECT c.id, c.school_id, s.owner_id 
     FROM courses c
     JOIN schools s ON c.school_id = s.id
     WHERE c.id = $1`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }

  const course = courseResult.rows[0];
  if (req.user!.role === 'school' && course.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diesen Kurs zu bearbeiten', 403);
  }

  const {
    title, description, level, category, price, currency, duration_weeks,
    hours_per_week, max_students, start_date, end_date, schedule, is_online
  } = req.body;

  // Dynamisches Update
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = {
    title, description, level, category, price, currency, duration_weeks,
    hours_per_week, max_students, start_date, end_date, schedule, is_online
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

  values.push(courseId);

  const result = await query(
    `UPDATE courses 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  res.json({
    message: 'Kurs erfolgreich aktualisiert',
    course: result.rows[0]
  });
}));

// Kurs löschen (deaktivieren)
router.delete('/:id', [
  authenticateToken,
  requireSchoolOrAdmin
], asyncHandler(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  // Berechtigung prüfen
  const courseResult = await query(
    `SELECT c.id, c.school_id, s.owner_id 
     FROM courses c
     JOIN schools s ON c.school_id = s.id
     WHERE c.id = $1`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }

  const course = courseResult.rows[0];
  if (req.user!.role === 'school' && course.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diesen Kurs zu löschen', 403);
  }

  // Prüfen, ob aktive Buchungen existieren
  const activeBookings = await query(
    'SELECT COUNT(*) FROM bookings WHERE course_id = $1 AND status IN ($2, $3)',
    [courseId, 'pending', 'confirmed']
  );

  if (parseInt(activeBookings.rows[0].count) > 0) {
    throw new AppError('Kurs kann nicht gelöscht werden. Es existieren aktive Buchungen.', 409);
  }

  // Kurs deaktivieren (soft delete)
  await query(
    'UPDATE courses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [courseId]
  );

  res.json({
    message: 'Kurs erfolgreich gelöscht'
  });
}));

// Tutor löscht eigenen Kurs
router.delete('/tutor/:id', [
  authenticateToken,
  requireTutorOrAdmin
], asyncHandler(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  let tutorId: number | undefined;
  if (req.user!.role === 'tutor') {
    // Find the tutor's ID for the logged-in user
    const tutorResult = await query('SELECT id FROM tutors WHERE user_id = $1', [req.user!.id]);
    if (tutorResult.rows.length === 0) {
      throw new AppError('Tutor-Profil nicht gefunden', 404);
    }
    tutorId = tutorResult.rows[0].id;
  }

  // Check if the course belongs to this tutor (if tutor) or just exists (if admin)
  const courseResult = await query('SELECT id, tutor_id FROM courses WHERE id = $1', [courseId]);
  if (courseResult.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }
  if (req.user!.role === 'tutor' && courseResult.rows[0].tutor_id !== tutorId) {
    throw new AppError('Keine Berechtigung diesen Kurs zu löschen', 403);
  }

  // Check for active bookings
  const activeBookings = await query(
    'SELECT COUNT(*) FROM bookings WHERE course_id = $1 AND status IN ($2, $3)',
    [courseId, 'pending', 'confirmed']
  );
  if (parseInt(activeBookings.rows[0].count) > 0) {
    throw new AppError('Kurs kann nicht gelöscht werden. Es existieren aktive Buchungen.', 409);
  }

  // Soft delete the course
  await query(
    'UPDATE courses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [courseId]
  );

  res.json({
    message: 'Kurs erfolgreich gelöscht'
  });
}));

// Kurs buchen
router.post('/:id/book', [
  authenticateToken,
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Ungültiges Startdatum'),
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

  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  // Kurs abrufen
  const courseResult = await query(
    `SELECT id, title, price, max_students, enrolled_students, start_date, end_date
     FROM courses 
     WHERE id = $1 AND is_active = TRUE`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }

  const course = courseResult.rows[0];

  // Prüfen, ob noch Plätze verfügbar sind
  if (course.enrolled_students >= course.max_students) {
    throw new AppError('Kurs ist bereits ausgebucht', 409);
  }

  // Prüfen, ob Benutzer bereits gebucht hat
  const existingBooking = await query(
    'SELECT id FROM bookings WHERE student_id = $1 AND course_id = $2 AND status != $3',
    [req.user!.id, courseId, 'cancelled']
  );

  if (existingBooking.rows.length > 0) {
    throw new AppError('Sie haben diesen Kurs bereits gebucht', 409);
  }

  const { start_date, notes } = req.body;

  // Buchung erstellen
  const bookingResult = await query(
    `INSERT INTO bookings 
     (student_id, course_id, booking_type, start_date, end_date, total_price, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      req.user!.id,
      courseId,
      'course',
      start_date || course.start_date,
      course.end_date,
      course.price,
      notes
    ]
  );

  // Anzahl eingeschriebener Studenten erhöhen
  await query(
    'UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = $1',
    [courseId]
  );

  res.status(201).json({
    message: 'Kurs erfolgreich gebucht',
    booking: bookingResult.rows[0]
  });
}));

// Kurs aktivieren/deaktivieren (Admin/Schule/Tutor)
router.patch('/:id/status', [
  authenticateToken,
  requireSchoolOrAdmin,
  body('is_active')
    .isBoolean()
    .withMessage('Status muss ein Boolean sein'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Grund zu lang')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const courseId = parseInt(req.params.id);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }

  const { is_active, reason } = req.body;

  // Berechtigung prüfen
  const courseResult = await query(
    `SELECT c.id, c.school_id, s.owner_id 
     FROM courses c
     JOIN schools s ON c.school_id = s.id
     WHERE c.id = $1`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Kurs nicht gefunden', 404);
  }

  const course = courseResult.rows[0];
  if (req.user!.role !== 'admin' && req.user!.role !== 'tutor' && course.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diesen Kurs zu bearbeiten', 403);
  }

  // Status aktualisieren
  await query(
    'UPDATE courses SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [is_active, courseId]
  );

  // Aktualisierten Kurs abrufen
  const updatedResult = await query(
    'SELECT * FROM courses WHERE id = $1',
    [courseId]
  );

  res.json({
    message: `Kurs ${is_active ? 'aktiviert' : 'deaktiviert'}`,
    course: updatedResult.rows[0]
  });
}));

export default router;