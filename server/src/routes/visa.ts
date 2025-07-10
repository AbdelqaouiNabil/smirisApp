import express from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Alle Visa-Services abrufen (öffentlich)
router.get('/', [
  optionalAuth,
  expressQuery('category').optional().isIn(['translation', 'consultation', 'application']).withMessage('Ungültige Kategorie'),
  expressQuery('max_price').optional().isFloat({ min: 0 }).withMessage('Ungültiger Höchstpreis')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const category = req.query.category as string;
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;

  // WHERE-Klauseln dynamisch aufbauen
  const whereConditions: string[] = ['is_active = TRUE'];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (category) {
    whereConditions.push(`category = $${paramIndex++}`);
    queryParams.push(category);
  }

  if (maxPrice !== undefined) {
    whereConditions.push(`price <= $${paramIndex++}`);
    queryParams.push(maxPrice);
  }

  const result = await query(
    `SELECT 
      id, uuid, name, description, price, currency, processing_time,
      required_documents, category, created_at
     FROM visa_services 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY category ASC, price ASC, name ASC`,
    queryParams
  );

  // Services nach Kategorie gruppieren
  const servicesByCategory = result.rows.reduce((acc: any, service: any) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  res.json({
    services: result.rows,
    servicesByCategory
  });
}));

// Einzelnen Visa-Service abrufen
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const serviceId = parseInt(req.params.id);
  if (isNaN(serviceId)) {
    throw validationError('Ungültige Service-ID');
  }

  const result = await query(
    `SELECT * FROM visa_services WHERE id = $1 AND is_active = TRUE`,
    [serviceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Visa-Service nicht gefunden', 404);
  }

  res.json({
    service: result.rows[0]
  });
}));

// Neuen Visa-Service erstellen (nur Admins)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service-Name muss zwischen 2 und 100 Zeichen lang sein'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Beschreibung muss zwischen 10 und 1000 Zeichen lang sein'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Preis muss eine positive Zahl sein'),
  body('category')
    .isIn(['translation', 'consultation', 'application'])
    .withMessage('Ungültige Kategorie'),
  body('processing_time')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Bearbeitungszeit erforderlich'),
  body('required_documents')
    .isArray()
    .withMessage('Erforderliche Dokumente müssen ein Array sein')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const {
    name, description, price, currency = 'MAD', processing_time,
    required_documents, category
  } = req.body;

  // Prüfen, ob Service bereits existiert
  const existingService = await query(
    'SELECT id FROM visa_services WHERE name = $1',
    [name]
  );
  if (existingService.rows.length > 0) {
    throw new AppError('Service mit diesem Namen existiert bereits', 409);
  }

  const result = await query(
    `INSERT INTO visa_services 
     (name, description, price, currency, processing_time, required_documents, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description, price, currency, processing_time, required_documents, category]
  );

  res.status(201).json({
    message: 'Visa-Service erfolgreich erstellt',
    service: result.rows[0]
  });
}));

// Visa-Service aktualisieren (nur Admins)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service-Name muss zwischen 2 und 100 Zeichen lang sein'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preis muss eine positive Zahl sein')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const serviceId = parseInt(req.params.id);
  if (isNaN(serviceId)) {
    throw validationError('Ungültige Service-ID');
  }

  // Service existiert prüfen
  const serviceExists = await query(
    'SELECT id FROM visa_services WHERE id = $1',
    [serviceId]
  );
  if (serviceExists.rows.length === 0) {
    throw new AppError('Visa-Service nicht gefunden', 404);
  }

  const {
    name, description, price, currency, processing_time, required_documents, category
  } = req.body;

  // Dynamisches Update
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = {
    name, description, price, currency, processing_time, required_documents, category
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

  values.push(serviceId);

  const result = await query(
    `UPDATE visa_services 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  res.json({
    message: 'Visa-Service erfolgreich aktualisiert',
    service: result.rows[0]
  });
}));

// Visa-Service löschen (nur Admins)
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const serviceId = parseInt(req.params.id);
  if (isNaN(serviceId)) {
    throw validationError('Ungültige Service-ID');
  }

  // Prüfen, ob aktive Buchungen existieren
  const activeBookings = await query(
    `SELECT COUNT(*) FROM bookings 
     WHERE booking_type = 'visa' AND status IN ('pending', 'confirmed')`,
    []
  );

  if (parseInt(activeBookings.rows[0].count) > 0) {
    throw new AppError('Service kann nicht gelöscht werden. Es existieren aktive Buchungen.', 409);
  }

  // Service deaktivieren (soft delete)
  const result = await query(
    'UPDATE visa_services SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING name',
    [serviceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Visa-Service nicht gefunden', 404);
  }

  res.json({
    message: `Visa-Service "${result.rows[0].name}" erfolgreich gelöscht`
  });
}));

// Visa-Service buchen
router.post('/:id/book', [
  authenticateToken,
  body('required_documents')
    .optional()
    .isArray()
    .withMessage('Dokumente müssen ein Array sein'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notizen zu lang'),
  body('contact_phone')
    .isMobilePhone('any')
    .withMessage('Gültige Telefonnummer erforderlich'),
  body('preferred_contact_method')
    .optional()
    .isIn(['phone', 'email', 'whatsapp'])
    .withMessage('Ungültige Kontaktmethode')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const serviceId = parseInt(req.params.id);
  if (isNaN(serviceId)) {
    throw validationError('Ungültige Service-ID');
  }

  const { required_documents, notes, contact_phone, preferred_contact_method } = req.body;

  // Service abrufen
  const serviceResult = await query(
    `SELECT id, name, price, processing_time, required_documents
     FROM visa_services 
     WHERE id = $1 AND is_active = TRUE`,
    [serviceId]
  );

  if (serviceResult.rows.length === 0) {
    throw new AppError('Visa-Service nicht gefunden', 404);
  }

  const service = serviceResult.rows[0];

  // Geschätzte Fertigstellung berechnen
  const processingDays = parseInt(service.processing_time.match(/\d+/)?.[0] || '5');
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + processingDays);

  // Buchung erstellen
  const bookingData = {
    student_id: req.user!.id,
    booking_type: 'visa',
    total_price: service.price,
    notes: notes || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: estimatedCompletion.toISOString().split('T')[0]
  };

  const bookingResult = await query(
    `INSERT INTO bookings 
     (student_id, booking_type, start_date, end_date, total_price, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      bookingData.student_id,
      bookingData.booking_type,
      bookingData.start_date,
      bookingData.end_date,
      bookingData.total_price,
      bookingData.notes
    ]
  );

  // Kontaktdaten des Benutzers aktualisieren
  if (contact_phone) {
    await query(
      'UPDATE users SET phone = $1 WHERE id = $2',
      [contact_phone, req.user!.id]
    );
  }

  res.status(201).json({
    message: 'Visa-Service erfolgreich gebucht',
    booking: bookingResult.rows[0],
    service: {
      name: service.name,
      processing_time: service.processing_time,
      estimated_completion: estimatedCompletion
    },
    next_steps: [
      'Sie erhalten innerhalb von 24 Stunden eine Bestätigung',
      'Bereiten Sie die erforderlichen Dokumente vor',
      `Geschätzte Fertigstellung: ${estimatedCompletion.toLocaleDateString('de-DE')}`,
      'Sie werden über den Fortschritt informiert'
    ]
  });
}));

// Visa-Service Statistiken (nur Admins)
router.get('/stats/overview', [
  authenticateToken,
  requireAdmin
], asyncHandler(async (req, res) => {
  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_services,
      COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_services,
      COUNT(CASE WHEN category = 'translation' THEN 1 END) as translation_services,
      COUNT(CASE WHEN category = 'consultation' THEN 1 END) as consultation_services,
      COUNT(CASE WHEN category = 'application' THEN 1 END) as application_services,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price
     FROM visa_services`,
    []
  );

  // Buchungsstatistiken für Visa-Services
  const bookingStatsResult = await query(
    `SELECT 
      COUNT(*) as total_visa_bookings,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
      SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_revenue
     FROM bookings 
     WHERE booking_type = 'visa'`,
    []
  );

  res.json({
    serviceStats: statsResult.rows[0],
    bookingStats: bookingStatsResult.rows[0]
  });
}));

// Beliebte Services abrufen
router.get('/stats/popular', optionalAuth, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      vs.id, vs.name, vs.category, vs.price, vs.processing_time,
      COUNT(b.id) as booking_count,
      AVG(CASE WHEN b.status = 'completed' THEN 5 ELSE 3 END) as avg_rating
     FROM visa_services vs
     LEFT JOIN bookings b ON vs.id = b.booking_type AND b.booking_type = 'visa'
     WHERE vs.is_active = TRUE
     GROUP BY vs.id, vs.name, vs.category, vs.price, vs.processing_time
     ORDER BY booking_count DESC, vs.price ASC
     LIMIT 6`,
    []
  );

  res.json({
    popularServices: result.rows
  });
}));

export default router;