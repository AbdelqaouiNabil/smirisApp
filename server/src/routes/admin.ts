import express, { Request, Response } from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Dashboard-Übersicht
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  // Grundlegende Statistiken
  const overviewStats = await query(
    `SELECT 
      (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = TRUE) as total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'tutor' AND is_active = TRUE) as total_tutors,
      (SELECT COUNT(*) FROM schools WHERE is_active = TRUE) as total_schools,
      (SELECT COUNT(*) FROM courses WHERE is_active = TRUE) as total_courses,
      (SELECT COUNT(*) FROM bookings) as total_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
      (SELECT SUM(total_price) FROM bookings WHERE status = 'completed') as total_revenue,
      (SELECT COUNT(*) FROM payments WHERE status = 'success') as successful_payments,
      (SELECT COUNT(*) FROM visa_services WHERE is_active = TRUE) as total_visa_services`
  );

  // Neueste Registrierungen (letzte 7 Tage)
  const recentUsers = await query(
    `SELECT 
      COUNT(*) as new_users_7d,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as new_users_1d
     FROM users 
     WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
  );

  // Buchungen der letzten 30 Tage
  const recentBookings = await query(
    `SELECT 
      DATE(created_at) as booking_date,
      COUNT(*) as booking_count,
      SUM(total_price) as daily_revenue
     FROM bookings 
     WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY booking_date DESC
     LIMIT 30`
  );

  // Top-performing Schulen
  const topSchools = await query(
    `SELECT 
      s.id, s.name, s.location, s.rating, s.review_count,
      COUNT(c.id) as course_count,
      COUNT(b.id) as booking_count
     FROM schools s
     LEFT JOIN courses c ON s.id = c.school_id AND c.is_active = TRUE
     LEFT JOIN bookings b ON c.id = b.course_id
     WHERE s.is_active = TRUE
     GROUP BY s.id, s.name, s.location, s.rating, s.review_count
     ORDER BY booking_count DESC, s.rating DESC
     LIMIT 5`
  );

  // System-Gesundheit
  const systemHealth = await query(
    `SELECT 
      (SELECT COUNT(*) FROM users WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_users_7d,
      (SELECT COUNT(*) FROM bookings WHERE status = 'pending' AND created_at < CURRENT_DATE - INTERVAL '24 hours') as stale_bookings,
      (SELECT COUNT(*) FROM payments WHERE status = 'pending' AND created_at < CURRENT_DATE - INTERVAL '1 hour') as stuck_payments`
  );

  res.json({
    overview: overviewStats.rows[0],
    growth: recentUsers.rows[0],
    recentActivity: recentBookings.rows,
    topSchools: topSchools.rows,
    systemHealth: systemHealth.rows[0]
  });
}));

// Benutzer-Verwaltung
router.get('/users', [
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl'),
  expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Ungültiges Limit'),
  expressQuery('role').optional().isIn(['student', 'tutor', 'school', 'admin']).withMessage('Ungültige Rolle'),
  expressQuery('status').optional().isIn(['active', 'inactive']).withMessage('Ungültiger Status'),
  expressQuery('search').optional().trim().isLength({ max: 100 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  const role = req.query.role as string;
  const status = req.query.status as string;
  const search = req.query.search as string;

  // WHERE-Klauseln aufbauen
  const whereConditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (role) {
    whereConditions.push(`role = $${paramIndex++}`);
    queryParams.push(role);
  }

  if (status === 'active') {
    whereConditions.push(`is_active = TRUE`);
  } else if (status === 'inactive') {
    whereConditions.push(`is_active = FALSE`);
  }

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`, `%${search}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Gesamtzahl
  const countResult = await query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Benutzer abrufen
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT 
      id, uuid, name, email, role, phone, location, avatar_url,
      language_preference, is_verified, is_active, last_login, created_at
     FROM users 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  res.json({
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Benutzer aktivieren/deaktivieren
router.patch('/users/:id/status', [
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

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    throw validationError('Ungültige Benutzer-ID');
  }

  const { is_active, reason } = req.body;

  // Prüfen, ob Benutzer existiert
  const userResult = await query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('Benutzer nicht gefunden', 404);
  }

  const user = userResult.rows[0];

  // Admin kann sich nicht selbst deaktivieren
  if (user.id === req.user!.id && !is_active) {
    throw new AppError('Sie können sich nicht selbst deaktivieren', 400);
  }

  // Status aktualisieren
  await query(
    'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [is_active, userId]
  );

  // Bei Deaktivierung auch abhängige Entitäten deaktivieren
  if (!is_active) {
    if (user.role === 'school') {
      await query(
        'UPDATE schools SET is_active = FALSE WHERE owner_id = $1',
        [userId]
      );
      await query(
        'UPDATE courses SET is_active = FALSE WHERE school_id IN (SELECT id FROM schools WHERE owner_id = $1)',
        [userId]
      );
    } else if (user.role === 'tutor') {
      await query(
        'UPDATE tutors SET is_available = FALSE WHERE user_id = $1',
        [userId]
      );
    }
  }

  res.json({
    message: `Benutzer ${is_active ? 'aktiviert' : 'deaktiviert'}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_active
    }
  });
}));

// Benutzer hart löschen (nur Admin)
router.delete('/users/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    throw validationError('Ungültige Benutzer-ID');
  }

  // Prüfen, ob Benutzer existiert
  const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('Benutzer nicht gefunden', 404);
  }

  // Optionale Bereinigung: Buchungen, Bewertungen, etc. löschen
  await query('DELETE FROM bookings WHERE student_id = $1 OR tutor_id = $1', [userId]);
  await query('DELETE FROM reviews WHERE user_id = $1', [userId]);
  await query('DELETE FROM tutors WHERE user_id = $1', [userId]);
  await query('DELETE FROM schools WHERE owner_id = $1', [userId]);

  // Benutzer löschen
  await query('DELETE FROM users WHERE id = $1', [userId]);

  res.json({ message: 'Benutzer erfolgreich gelöscht', userId });
}));

// Content-Moderation
router.get('/content/reviews', [
  expressQuery('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Ungültiger Status'),
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl')
], asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  let whereClause = '';
  const queryParams: any[] = [];

  if (status === 'pending') {
    whereClause = 'WHERE r.is_verified = FALSE AND r.is_public = TRUE';
  } else if (status === 'approved') {
    whereClause = 'WHERE r.is_verified = TRUE AND r.is_public = TRUE';
  } else if (status === 'rejected') {
    whereClause = 'WHERE r.is_public = FALSE';
  }

  const result = await query(
    `SELECT 
      r.id, r.rating, r.title, r.comment, r.is_verified, r.is_public, r.created_at,
      u.name as reviewer_name, u.email as reviewer_email,
      COALESCE(s.name, tu.name) as reviewed_entity_name,
      CASE 
        WHEN r.school_id IS NOT NULL THEN 'school'
        WHEN r.tutor_id IS NOT NULL THEN 'tutor'
        WHEN r.course_id IS NOT NULL THEN 'course'
      END as reviewed_entity_type
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     LEFT JOIN schools s ON r.school_id = s.id
     LEFT JOIN tutors t ON r.tutor_id = t.id
     LEFT JOIN users tu ON t.user_id = tu.id
     LEFT JOIN courses c ON r.course_id = c.id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  res.json({
    reviews: result.rows,
    pagination: { page, limit }
  });
}));

// Bewertung moderieren
router.patch('/content/reviews/:id', [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Ungültige Aktion'),
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

  const reviewId = parseInt(req.params.id);
  if (isNaN(reviewId)) {
    throw validationError('Ungültige Bewertungs-ID');
  }

  const { action, reason } = req.body;

  const isApproved = action === 'approve';
  const isPublic = action === 'approve';

  await query(
    'UPDATE reviews SET is_verified = $1, is_public = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    [isApproved, isPublic, reviewId]
  );

  res.json({
    message: `Bewertung ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`,
    action,
    reason
  });
}));

// Plattform-Statistiken
router.get('/analytics/overview', asyncHandler(async (req: Request, res: Response) => {
  // Umsatz-Trends (letzte 12 Monate)
  const revenueStats = await query(
    `SELECT 
      DATE_TRUNC('month', created_at) as month,
      SUM(total_price) as revenue,
      COUNT(*) as booking_count
     FROM bookings 
     WHERE status = 'completed' 
       AND created_at >= CURRENT_DATE - INTERVAL '12 months'
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY month DESC`
  );

  // Benutzer-Wachstum
  const userGrowth = await query(
    `SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as new_users,
      COUNT(CASE WHEN role = 'student' THEN 1 END) as new_students,
      COUNT(CASE WHEN role = 'tutor' THEN 1 END) as new_tutors,
      COUNT(CASE WHEN role = 'school' THEN 1 END) as new_schools
     FROM users 
     WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY month DESC`
  );

  // Beliebteste Kurslevel
  const courseLevels = await query(
    `SELECT 
      level,
      COUNT(*) as course_count,
      COUNT(b.id) as booking_count
     FROM courses c
     LEFT JOIN bookings b ON c.id = b.course_id
     WHERE c.is_active = TRUE
     GROUP BY level
     ORDER BY booking_count DESC`
  );

  // Top-Städte
  const topCities = await query(
    `SELECT 
      s.location,
      COUNT(s.id) as school_count,
      COUNT(c.id) as course_count,
      COUNT(b.id) as booking_count
     FROM schools s
     LEFT JOIN courses c ON s.id = c.school_id AND c.is_active = TRUE
     LEFT JOIN bookings b ON c.id = b.course_id
     WHERE s.is_active = TRUE
     GROUP BY s.location
     ORDER BY booking_count DESC
     LIMIT 10`
  );

  res.json({
    revenue: revenueStats.rows,
    userGrowth: userGrowth.rows,
    courseLevels: courseLevels.rows,
    topCities: topCities.rows
  });
}));

// Systemkonfiguration
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  // Hier würde normalerweise eine Konfigurationstabelle gelesen
  const config = {
    platform: {
      name: 'Germansphere',
      version: '1.0.0',
      maintenance_mode: false,
      max_file_upload_size: '10MB',
      supported_languages: ['de', 'fr', 'ar']
    },
    booking: {
      cancellation_policy_hours: 24,
      auto_confirm_bookings: false,
      max_bookings_per_user: 10
    },
    payment: {
      currency: 'MAD',
      payment_methods: ['stripe', 'paypal'],
      commission_rate: 0.05
    },
    email: {
      smtp_enabled: true,
      notification_emails: true,
      welcome_email: true
    }
  };

  res.json({ config });
}));

// Systemkonfiguration aktualisieren
router.put('/config', [
  body('section')
    .isIn(['platform', 'booking', 'payment', 'email'])
    .withMessage('Ungültige Konfigurationssektion'),
  body('settings')
    .isObject()
    .withMessage('Einstellungen müssen ein Objekt sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { section, settings } = req.body;

  // In einer echten Anwendung würde hier die Konfiguration in der Datenbank gespeichert
  res.json({
    message: `Konfiguration für ${section} erfolgreich aktualisiert`,
    section,
    settings
  });
}));

// System-Backup erstellen
router.post('/backup', asyncHandler(async (req: Request, res: Response) => {
  // In einer echten Anwendung würde hier ein vollständiges Datenbank-Backup erstellt
  const backupId = `backup_${Date.now()}`;
  
  res.json({
    message: 'Backup erfolgreich erstellt',
    backup_id: backupId,
    created_at: new Date().toISOString(),
    size: '15.2 MB' // Beispielwert
  });
}));

// Benachrichtigungen senden
router.post('/notifications', [
  body('type')
    .isIn(['announcement', 'maintenance', 'promotion'])
    .withMessage('Ungültiger Benachrichtigungstyp'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Titel erforderlich'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Nachricht erforderlich'),
  body('target_users')
    .optional()
    .isArray()
    .withMessage('Zielbenutzer müssen ein Array sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { type, title, message, target_users } = req.body;

  // In einer echten Anwendung würde hier eine Benachrichtigung über E-Mail/Push gesendet
  let targetCount = 0;
  
  if (target_users && target_users.length > 0) {
    targetCount = target_users.length;
  } else {
    // An alle aktiven Benutzer senden
    const countResult = await query(
      'SELECT COUNT(*) FROM users WHERE is_active = TRUE'
    );
    targetCount = parseInt(countResult.rows[0].count);
  }

  res.json({
    message: 'Benachrichtigung erfolgreich gesendet',
    type,
    title,
    target_count: targetCount,
    sent_at: new Date().toISOString()
  });
}));

export default router;