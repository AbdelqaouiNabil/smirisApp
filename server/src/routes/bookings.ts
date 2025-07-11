import express from 'express';
import { body, query as expressQuery, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken, requireTutorOrAdmin, requireSchoolOrAdmin } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Alle Buchungen für den aktuellen Benutzer abrufen
router.get('/', [
  authenticateToken,
  expressQuery('page').optional().isInt({ min: 1 }).withMessage('Ungültige Seitenzahl'),
  expressQuery('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Ungültiges Limit'),
  expressQuery('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Ungültiger Status'),
  expressQuery('type').optional().isIn(['course', 'tutor', 'visa']).withMessage('Ungültiger Buchungstyp')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Ungültige Abfrageparameter');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  const type = req.query.type as string;

  // WHERE-Klauseln basierend auf Benutzerrolle
  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (req.user!.role === 'student') {
    whereConditions.push(`b.student_id = $${paramIndex++}`);
    queryParams.push(req.user!.id);
  } else if (req.user!.role === 'tutor') {
    // Tutoren sehen nur ihre eigenen Buchungen
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [req.user!.id]
    );
    if (tutorResult.rows.length === 0) {
      throw new AppError('Tutor-Profil nicht gefunden', 404);
    }
    whereConditions.push(`b.tutor_id = $${paramIndex++}`);
    queryParams.push(tutorResult.rows[0].id);
  } else if (req.user!.role === 'school') {
    // Schulen sehen Buchungen für ihre Kurse
    whereConditions.push(`c.school_id IN (SELECT id FROM schools WHERE owner_id = $${paramIndex++})`);
    queryParams.push(req.user!.id);
  }
  // Admins sehen alle Buchungen (keine zusätzliche WHERE-Klausel)

  if (status) {
    whereConditions.push(`b.status = $${paramIndex++}`);
    queryParams.push(status);
  }

  if (type) {
    whereConditions.push(`b.booking_type = $${paramIndex++}`);
    queryParams.push(type);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Gesamtzahl der Buchungen
  const countResult = await query(
    `SELECT COUNT(*) 
     FROM bookings b
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // Buchungen abrufen
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT 
      b.id, b.uuid, b.booking_type, b.status, b.start_date, b.end_date, 
      b.time_slot, b.duration_minutes, b.total_price, b.currency, 
      b.payment_status, b.notes, b.meeting_link, b.is_recurring, 
      b.recurring_pattern, b.created_at, b.updated_at,
      -- Student-Informationen
      s.name as student_name, s.email as student_email,
      -- Kurs-Informationen
      c.title as course_title, c.level as course_level,
      sc.name as school_name, sc.location as school_location,
      -- Tutor-Informationen
      tu.name as tutor_name, tu.email as tutor_email,
      t.hourly_rate as tutor_rate,
      -- Visa-Service-Informationen
      vs.name as visa_service_name
     FROM bookings b
     LEFT JOIN users s ON b.student_id = s.id
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN schools sc ON c.school_id = sc.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     LEFT JOIN users tu ON t.user_id = tu.id
     LEFT JOIN visa_services vs ON b.booking_type = 'visa'
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    queryParams
  );

  res.json({
    bookings: result.rows,
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

// Einzelne Buchung abrufen
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    throw validationError('Ungültige Buchungs-ID');
  }

  const result = await query(
    `SELECT 
      b.*,
      s.name as student_name, s.email as student_email, s.phone as student_phone,
      c.title as course_title, c.level as course_level, c.description as course_description,
      sc.name as school_name, sc.location as school_location, sc.phone as school_phone,
      tu.name as tutor_name, tu.email as tutor_email, tu.phone as tutor_phone,
      t.hourly_rate as tutor_rate, t.bio as tutor_bio,
      vs.name as visa_service_name, vs.description as visa_service_description
     FROM bookings b
     LEFT JOIN users s ON b.student_id = s.id
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN schools sc ON c.school_id = sc.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     LEFT JOIN users tu ON t.user_id = tu.id
     LEFT JOIN visa_services vs ON b.booking_type = 'visa'
     WHERE b.id = $1`,
    [bookingId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden', 404);
  }

  const booking = result.rows[0];

  // Berechtigung prüfen
  const canAccess = 
    req.user!.role === 'admin' ||
    booking.student_id === req.user!.id ||
    (req.user!.role === 'tutor' && booking.tutor_id) ||
    (req.user!.role === 'school' && booking.course_id);

  if (!canAccess) {
    throw new AppError('Keine Berechtigung diese Buchung anzuzeigen', 403);
  }

  res.json({ booking });
}));

// Neue Buchung erstellen
router.post('/', [
  authenticateToken,
  body('booking_type')
    .isIn(['course', 'tutor', 'visa'])
    .withMessage('Ungültiger Buchungstyp'),
  body('course_id')
    .optional()
    .isInt()
    .withMessage('Ungültige Kurs-ID'),
  body('tutor_id')
    .optional()
    .isInt()
    .withMessage('Ungültige Tutor-ID'),
  body('start_date')
    .isISO8601()
    .withMessage('Ungültiges Startdatum'),
  body('time_slot')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Ungültige Uhrzeit (Format: HH:MM)'),
  body('duration_minutes')
    .isInt({ min: 30, max: 240 })
    .withMessage('Dauer muss zwischen 30 und 240 Minuten liegen'),
  body('subject')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Thema muss zwischen 3 und 200 Zeichen lang sein'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notizen zu lang')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const {
    booking_type,
    course_id,
    tutor_id,
    start_date,
    time_slot,
    duration_minutes,
    subject,
    notes
  } = req.body;

  const student_id = req.user!.id;

  // Validierung basierend auf Buchungstyp
  if (booking_type === 'tutor' && !tutor_id) {
    throw new AppError('Tutor-ID ist für Tutor-Buchungen erforderlich', 400);
  }

  if (booking_type === 'course' && !course_id) {
    throw new AppError('Kurs-ID ist für Kurs-Buchungen erforderlich', 400);
  }

  let total_price = 0;
  let tutorInfo = null;
  let courseInfo = null;

  // Preis berechnen und Verfügbarkeit prüfen
  if (booking_type === 'tutor') {
    // Tutor-Informationen abrufen
    const tutorResult = await query(
      'SELECT t.*, u.name FROM tutors t JOIN users u ON t.user_id = u.id WHERE t.id = $1',
      [tutor_id]
    );

    if (tutorResult.rows.length === 0) {
      throw new AppError('Tutor nicht gefunden', 404);
    }

    tutorInfo = tutorResult.rows[0];
    total_price = (tutorInfo.hourly_rate * duration_minutes) / 60;

    // Verfügbarkeit prüfen
    const bookingDate = new Date(start_date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    
    if (tutorInfo.availability && tutorInfo.availability.weeklySchedule) {
      const daySchedule = tutorInfo.availability.weeklySchedule[dayOfWeek];
      
      if (!daySchedule || !daySchedule.enabled) {
        throw new AppError('Tutor ist an diesem Tag nicht verfügbar', 400);
      }

      // Prüfen ob der gewünschte Zeitslot verfügbar ist
      const timeSlotAvailable = daySchedule.timeSlots?.some(slot => 
        slot.start === time_slot && slot.available === true
      );

      if (!timeSlotAvailable) {
        throw new AppError('Gewünschter Zeitslot ist nicht verfügbar', 400);
      }

      // Prüfen ob bereits eine Buchung für diesen Zeitraum existiert
      const conflictingBooking = await query(
        `SELECT id FROM bookings 
         WHERE tutor_id = $1 AND start_date = $2 AND time_slot = $3 
         AND status IN ('pending', 'confirmed')`,
        [tutor_id, start_date, time_slot]
      );

      if (conflictingBooking.rows.length > 0) {
        throw new AppError('Zeitslot ist bereits gebucht', 409);
      }
    }
  }

  // Buchung erstellen
  const bookingResult = await query(
    `INSERT INTO bookings (
      student_id, booking_type, course_id, tutor_id, start_date, time_slot,
      duration_minutes, total_price, currency, subject, notes, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      student_id, booking_type, course_id, tutor_id, start_date, time_slot,
      duration_minutes, total_price, 'EUR', subject, notes, 'confirmed'
    ]
  );

  const newBooking = bookingResult.rows[0];

  // WICHTIG: Tutor-Verfügbarkeit aktualisieren
  if (booking_type === 'tutor' && tutorInfo) {
    const updatedAvailability = { ...tutorInfo.availability };
    const bookingDate = new Date(start_date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    
    if (updatedAvailability.weeklySchedule && updatedAvailability.weeklySchedule[dayOfWeek]) {
      // Zeitslot als nicht verfügbar markieren
      updatedAvailability.weeklySchedule[dayOfWeek].timeSlots = 
        updatedAvailability.weeklySchedule[dayOfWeek].timeSlots.map(slot => 
          slot.start === time_slot 
            ? { ...slot, available: false }
            : slot
        );

      // Verfügbarkeit in der Datenbank aktualisieren
      await query(
        'UPDATE tutors SET availability = $1 WHERE id = $2',
        [JSON.stringify(updatedAvailability), tutor_id]
      );
    }
  }

  // Kurs-Teilnehmerzahl erhöhen (falls Kurs-Buchung)
  if (booking_type === 'course') {
    await query(
      'UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = $1',
      [course_id]
    );
  }

  res.status(201).json({
    message: 'Buchung erfolgreich erstellt',
    booking: newBooking
  });
}));

// Buchungsstatus aktualisieren
router.patch('/:id/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Ungültiger Status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notizen zu lang')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    throw validationError('Ungültige Buchungs-ID');
  }

  const { status, notes } = req.body;

  // Buchung abrufen
  const bookingResult = await query(
    `SELECT b.*, c.school_id, t.user_id as tutor_user_id
     FROM bookings b
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     WHERE b.id = $1`,
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden', 404);
  }

  const booking = bookingResult.rows[0];

  // Berechtigung prüfen
  let canUpdate = req.user!.role === 'admin' || booking.student_id === req.user!.id;
  
  if (req.user!.role === 'tutor' && booking.tutor_user_id === req.user!.id) {
    canUpdate = true;
  }
  
  if (req.user!.role === 'school' && booking.school_id) {
    const schoolResult = await query(
      'SELECT owner_id FROM schools WHERE id = $1',
      [booking.school_id]
    );
    if (schoolResult.rows.length > 0 && schoolResult.rows[0].owner_id === req.user!.id) {
      canUpdate = true;
    }
  }

  if (!canUpdate) {
    throw new AppError('Keine Berechtigung diese Buchung zu aktualisieren', 403);
  }

  // Status-Übergangsregeln prüfen
  const currentStatus = booking.status;
  const validTransitions: { [key: string]: string[] } = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'cancelled': [], // Stornierte Buchungen können nicht mehr geändert werden
    'completed': [] // Abgeschlossene Buchungen können nicht mehr geändert werden
  };

  if (!validTransitions[currentStatus].includes(status)) {
    throw new AppError(`Status kann nicht von ${currentStatus} zu ${status} geändert werden`, 400);
  }

  // Status aktualisieren
  const result = await query(
    `UPDATE bookings 
     SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, notes, bookingId]
  );

  // Bei Kurs-Buchungen: Teilnehmerzahl entsprechend anpassen
  if (booking.booking_type === 'course' && booking.course_id) {
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      // Teilnehmerzahl verringern
      await query(
        'UPDATE courses SET enrolled_students = enrolled_students - 1 WHERE id = $1',
        [booking.course_id]
      );
    } else if (status === 'confirmed' && currentStatus === 'cancelled') {
      // Teilnehmerzahl erhöhen (falls aus Stornierung wieder bestätigt)
      await query(
        'UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = $1',
        [booking.course_id]
      );
    }
  }

  // Bei Tutor-Buchungen: Statistiken aktualisieren
  if (booking.booking_type === 'tutor' && booking.tutor_id && status === 'completed') {
    await query(
      `UPDATE tutors 
       SET total_hours = total_hours + $1,
           total_students = (
             SELECT COUNT(DISTINCT student_id) 
             FROM bookings 
             WHERE tutor_id = $2 AND status = 'completed'
           )
       WHERE id = $2`,
      [booking.duration_minutes / 60, booking.tutor_id]
    );
  }

  res.json({
    message: 'Buchungsstatus erfolgreich aktualisiert',
    booking: result.rows[0]
  });
}));

// Buchung stornieren
router.delete('/:id', asyncHandler(async (req, res) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    throw validationError('Ungültige Buchungs-ID');
  }

  // Buchung abrufen
  const bookingResult = await query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden', 404);
  }

  const booking = bookingResult.rows[0];

  // Berechtigung prüfen (nur Student oder Admin kann stornieren)
  if (req.user!.role !== 'admin' && booking.student_id !== req.user!.id) {
    throw new AppError('Keine Berechtigung diese Buchung zu stornieren', 403);
  }

  // Prüfen, ob Buchung stornierbar ist
  if (booking.status === 'completed') {
    throw new AppError('Abgeschlossene Buchungen können nicht storniert werden', 400);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Buchung ist bereits storniert', 400);
  }

  // Stornierungsrichtlinien prüfen (z.B. 24h vor Beginn)
  const startDate = new Date(booking.start_date);
  const now = new Date();
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart < 24) {
    throw new AppError('Buchungen können nur bis 24 Stunden vor Beginn storniert werden', 400);
  }

  // Buchung stornieren
  await query(
    'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['cancelled', bookingId]
  );

  // Bei Tutor-Buchungen: Verfügbarkeit wiederherstellen
  if (booking.booking_type === 'tutor' && booking.tutor_id) {
    const tutorResult = await query(
      'SELECT availability FROM tutors WHERE id = $1',
      [booking.tutor_id]
    );

    if (tutorResult.rows.length > 0 && tutorResult.rows[0].availability) {
      const updatedAvailability = { ...tutorResult.rows[0].availability };
      const bookingDate = new Date(booking.start_date);
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
      
      if (updatedAvailability.weeklySchedule && updatedAvailability.weeklySchedule[dayOfWeek]) {
        // Zeitslot wieder als verfügbar markieren
        updatedAvailability.weeklySchedule[dayOfWeek].timeSlots = 
          updatedAvailability.weeklySchedule[dayOfWeek].timeSlots.map(slot => 
            slot.start === booking.time_slot 
              ? { ...slot, available: true }
              : slot
          );

        // Verfügbarkeit in der Datenbank aktualisieren
        await query(
          'UPDATE tutors SET availability = $1 WHERE id = $2',
          [JSON.stringify(updatedAvailability), booking.tutor_id]
        );
      }
    }
  }

  // Bei Kurs-Buchungen: Teilnehmerzahl verringern
  if (booking.booking_type === 'course' && booking.course_id) {
    await query(
      'UPDATE courses SET enrolled_students = enrolled_students - 1 WHERE id = $1',
      [booking.course_id]
    );
  }

  res.json({
    message: 'Buchung erfolgreich storniert'
  });
}));

// Meeting-Link für Online-Buchungen hinzufügen
router.patch('/:id/meeting-link', [
  body('meeting_link')
    .isURL()
    .withMessage('Ungültiger Meeting-Link')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    throw validationError('Ungültige Buchungs-ID');
  }

  const { meeting_link } = req.body;

  // Buchung abrufen
  const bookingResult = await query(
    `SELECT b.*, t.user_id as tutor_user_id, c.school_id
     FROM bookings b
     LEFT JOIN tutors t ON b.tutor_id = t.id
     LEFT JOIN courses c ON b.course_id = c.id
     WHERE b.id = $1`,
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden', 404);
  }

  const booking = bookingResult.rows[0];

  // Nur Tutoren oder Schulen können Meeting-Links hinzufügen
  let canAddLink = req.user!.role === 'admin';
  
  if (req.user!.role === 'tutor' && booking.tutor_user_id === req.user!.id) {
    canAddLink = true;
  }
  
  if (req.user!.role === 'school' && booking.school_id) {
    const schoolResult = await query(
      'SELECT owner_id FROM schools WHERE id = $1',
      [booking.school_id]
    );
    if (schoolResult.rows.length > 0 && schoolResult.rows[0].owner_id === req.user!.id) {
      canAddLink = true;
    }
  }

  if (!canAddLink) {
    throw new AppError('Keine Berechtigung Meeting-Link hinzuzufügen', 403);
  }

  // Meeting-Link aktualisieren
  const result = await query(
    `UPDATE bookings 
     SET meeting_link = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [meeting_link, bookingId]
  );

  res.json({
    message: 'Meeting-Link erfolgreich hinzugefügt',
    booking: result.rows[0]
  });
}));

// Buchungsstatistiken abrufen
router.get('/stats/overview', asyncHandler(async (req, res) => {
  let whereCondition = '';
  const queryParams: any[] = [];

  // Statistiken basierend auf Benutzerrolle filtern
  if (req.user!.role === 'student') {
    whereCondition = 'WHERE b.student_id = $1';
    queryParams.push(req.user!.id);
  } else if (req.user!.role === 'tutor') {
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [req.user!.id]
    );
    if (tutorResult.rows.length > 0) {
      whereCondition = 'WHERE b.tutor_id = $1';
      queryParams.push(tutorResult.rows[0].id);
    }
  } else if (req.user!.role === 'school') {
    whereCondition = 'WHERE c.school_id IN (SELECT id FROM schools WHERE owner_id = $1)';
    queryParams.push(req.user!.id);
  }

  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
      COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
      COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
      SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as total_revenue,
      COUNT(CASE WHEN b.booking_type = 'course' THEN 1 END) as course_bookings,
      COUNT(CASE WHEN b.booking_type = 'tutor' THEN 1 END) as tutor_bookings,
      COUNT(CASE WHEN b.booking_type = 'visa' THEN 1 END) as visa_bookings
     FROM bookings b
     LEFT JOIN courses c ON b.course_id = c.id
     ${whereCondition}`,
    queryParams
  );

  res.json({
    stats: statsResult.rows[0]
  });
}));

export default router;