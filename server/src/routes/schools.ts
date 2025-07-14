import express, { Request, Response } from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken, requireSchoolOrAdmin, optionalAuth } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Alle Schulen abrufen (öffentlich, mit optionaler Authentifizierung)
router.get('/', [
  optionalAuth,
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl'),
  expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Ungültiges Limit'),
  expressQuery('location').optional().trim().isLength({ max: 100 }),
  expressQuery('rating').optional().isFloat({ min: 0, max: 5 }),
  expressQuery('search').optional().trim().isLength({ max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const location = req.query.location as string;
  const minRating = req.query.rating ? parseFloat(req.query.rating as string) : undefined;
  const searchTerm = req.query.search as string;

  // WHERE-Klauseln dynamisch aufbauen
  const whereConditions: string[] = ['is_active = TRUE'];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (location) {
    whereConditions.push(`location ILIKE $${paramIndex++}`);
    queryParams.push(`%${location}%`);
  }

  if (minRating !== undefined) {
    whereConditions.push(`rating >= $${paramIndex++}`);
    queryParams.push(minRating);
  }

  if (searchTerm) {
    whereConditions.push(`(name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex})`);
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    paramIndex++;
  }

  // Gesamtzahl der Schulen
  const countResult = await query(
    `SELECT COUNT(*) FROM schools WHERE ${whereConditions.join(' AND ')}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Schulen abrufen
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT 
      id, uuid, name, description, location, address, latitude, longitude,
      phone, email, website, certifications, features, rating, review_count,
      image_url, is_verified, created_at
     FROM schools 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY rating DESC, review_count DESC, name ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  res.json({
    schools: result.rows,
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

// Einzelne Schule abrufen
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const schoolId = parseInt(req.params.id);
  if (isNaN(schoolId)) {
    throw validationError('Ungültige Schul-ID');
  }

  const result = await query(
    `SELECT 
      s.*, 
      COUNT(c.id) as total_courses,
      AVG(c.price) as avg_price,
      COUNT(DISTINCT r.id) as total_reviews
     FROM schools s
     LEFT JOIN courses c ON s.id = c.school_id AND c.is_active = TRUE
     LEFT JOIN reviews r ON s.id = r.school_id AND r.is_public = TRUE
     WHERE s.id = $1 AND s.is_active = TRUE
     GROUP BY s.id`,
    [schoolId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Schule nicht gefunden', 404);
  }

  const school = result.rows[0];

  // Aktuelle Kurse abrufen
  const coursesResult = await query(
    `SELECT id, title, level, price, duration_weeks, start_date, enrolled_students, max_students
     FROM courses 
     WHERE school_id = $1 AND is_active = TRUE
     ORDER BY start_date ASC`,
    [schoolId]
  );

  // Bewertungen abrufen
  const reviewsResult = await query(
    `SELECT r.rating, r.title, r.comment, r.created_at, u.name as reviewer_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.school_id = $1 AND r.is_public = TRUE
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [schoolId]
  );

  res.json({
    school,
    courses: coursesResult.rows,
    reviews: reviewsResult.rows
  });
}));

// Fetch school by user_id (owner_id)
router.get('/by-user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) throw validationError('Ungültige User-ID');
  const result = await query(
    `SELECT * FROM schools WHERE owner_id = $1 AND is_active = TRUE`,
    [userId]
  );
  if (result.rows.length === 0) throw new AppError('Schule nicht gefunden', 404);
  res.json({ school: result.rows[0] });
}));

// Neue Schule erstellen (nur für Admins und Schul-Accounts)
router.post('/', [
  authenticateToken,
  requireSchoolOrAdmin,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Schulname muss zwischen 2 und 100 Zeichen lang sein'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Standort erforderlich'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Beschreibung zu lang'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Ungültige Telefonnummer'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Ungültige E-Mail-Adresse'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Ungültige Website-URL')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const {
    name, description, location, address, latitude, longitude,
    phone, email, website, certifications, features
  } = req.body;

  // Prüfen, ob Schule bereits existiert
  const existingSchool = await query(
    'SELECT id FROM schools WHERE name = $1 AND location = $2',
    [name, location]
  );
  if (existingSchool.rows.length > 0) {
    throw new AppError('Schule mit diesem Namen existiert bereits an diesem Standort', 409);
  }

  const result = await query(
    `INSERT INTO schools 
     (name, description, location, address, latitude, longitude, phone, email, 
      website, certifications, features, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      name, description, location, address, latitude, longitude,
      phone, email, website, certifications, features, req.user!.id
    ]
  );

  res.status(201).json({
    message: 'Schule erfolgreich erstellt',
    school: result.rows[0]
  });
}));

// Schule aktualisieren
router.put('/:id', [
  authenticateToken,
  requireSchoolOrAdmin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Schulname muss zwischen 2 und 100 Zeichen lang sein'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Beschreibung zu lang')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const schoolId = parseInt(req.params.id);
  if (isNaN(schoolId)) {
    throw validationError('Ungültige Schul-ID');
  }

  // Berechtigung prüfen (Schule kann nur ihre eigenen Daten bearbeiten)
  const schoolResult = await query(
    'SELECT id, owner_id FROM schools WHERE id = $1',
    [schoolId]
  );

  if (schoolResult.rows.length === 0) {
    throw new AppError('Schule nicht gefunden', 404);
  }

  const school = schoolResult.rows[0];
  if (req.user!.role !== 'admin' && school.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diese Schule zu bearbeiten', 403);
  }

  const {
    name, description, location, address, latitude, longitude,
    phone, email, website, certifications, features
  } = req.body;

  // Dynamisches Update basierend auf bereitgestellten Feldern
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = {
    name, description, location, address, latitude, longitude,
    phone, email, website, certifications, features
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

  values.push(schoolId);

  const result = await query(
    `UPDATE schools 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  res.json({
    message: 'Schule erfolgreich aktualisiert',
    school: result.rows[0]
  });
}));

// Schule löschen (deaktivieren)
router.delete('/:id', [
  authenticateToken,
  requireSchoolOrAdmin
], asyncHandler(async (req: Request, res: Response) => {
  const schoolId = parseInt(req.params.id);
  if (isNaN(schoolId)) {
    throw validationError('Ungültige Schul-ID');
  }

  // Berechtigung prüfen
  const schoolResult = await query(
    'SELECT id, owner_id FROM schools WHERE id = $1',
    [schoolId]
  );

  if (schoolResult.rows.length === 0) {
    throw new AppError('Schule nicht gefunden', 404);
  }

  const school = schoolResult.rows[0];
  if (req.user!.role !== 'admin' && school.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diese Schule zu löschen', 403);
  }

  // Schule deaktivieren (soft delete)
  await query(
    'UPDATE schools SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [schoolId]
  );

  // Auch zugehörige Kurse deaktivieren
  await query(
    'UPDATE courses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
    [schoolId]
  );

  res.json({
    message: 'Schule erfolgreich gelöscht'
  });
}));

// Schule aktivieren/deaktivieren (Admin/Schule)
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

  const schoolId = parseInt(req.params.id);
  if (isNaN(schoolId)) {
    throw validationError('Ungültige Schul-ID');
  }

  const { is_active, reason } = req.body;

  // Berechtigung prüfen (Schule kann nur ihre eigenen Daten bearbeiten)
  const schoolResult = await query(
    'SELECT id, owner_id FROM schools WHERE id = $1',
    [schoolId]
  );

  if (schoolResult.rows.length === 0) {
    throw new AppError('Schule nicht gefunden', 404);
  }

  const school = schoolResult.rows[0];
  if (req.user!.role !== 'admin' && school.owner_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diese Schule zu bearbeiten', 403);
  }

  // Status aktualisieren
  await query(
    'UPDATE schools SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [is_active, schoolId]
  );

  // Bei Deaktivierung auch zugehörige Kurse deaktivieren
  if (!is_active) {
    await query(
      'UPDATE courses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
      [schoolId]
    );
  }

  // Aktualisierte Schule abrufen
  const updatedResult = await query(
    'SELECT * FROM schools WHERE id = $1',
    [schoolId]
  );

  res.json({
    message: `Schule ${is_active ? 'aktiviert' : 'deaktiviert'}`,
    school: updatedResult.rows[0]
  });
}));

// Bewertung für Schule hinzufügen
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

  const schoolId = parseInt(req.params.id);
  if (isNaN(schoolId)) {
    throw validationError('Ungültige Schul-ID');
  }

  const { rating, title, comment } = req.body;

  // Prüfen, ob Schule existiert
  const schoolExists = await query(
    'SELECT id FROM schools WHERE id = $1 AND is_active = TRUE',
    [schoolId]
  );
  if (schoolExists.rows.length === 0) {
    throw new AppError('Schule nicht gefunden', 404);
  }

  // Prüfen, ob Benutzer bereits eine Bewertung abgegeben hat
  const existingReview = await query(
    'SELECT id FROM reviews WHERE user_id = $1 AND school_id = $2',
    [req.user!.id, schoolId]
  );
  if (existingReview.rows.length > 0) {
    throw new AppError('Sie haben bereits eine Bewertung für diese Schule abgegeben', 409);
  }

  // Bewertung hinzufügen
  const result = await query(
    `INSERT INTO reviews (user_id, school_id, rating, title, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user!.id, schoolId, rating, title, comment]
  );

  // Schul-Rating und Review-Count aktualisieren
  await query(
    `UPDATE schools 
     SET rating = (
       SELECT AVG(rating) FROM reviews WHERE school_id = $1 AND is_public = TRUE
     ),
     review_count = (
       SELECT COUNT(*) FROM reviews WHERE school_id = $1 AND is_public = TRUE
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [schoolId]
  );

  res.status(201).json({
    message: 'Bewertung erfolgreich hinzugefügt',
    review: result.rows[0]
  });
}));

export default router;