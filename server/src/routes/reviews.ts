import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, validationError, AppError } from '../middleware/errorHandler';

const router = express.Router();

// POST /api/reviews - Add a review for a course
router.post(
  '/',
  authenticateToken,
  [
    body('course_id').isInt().withMessage('Ungültige Kurs-ID'),
    body('booking_id').isInt().withMessage('Ungültige Buchungs-ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Bewertung muss zwischen 1 und 5 liegen'),
    body('comment').isString().isLength({ min: 3, max: 1000 }).withMessage('Kommentar zu kurz oder zu lang'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationError('Eingabedaten sind ungültig');
    }

    const { course_id, booking_id, rating, comment } = req.body;
    const user_id = req.user!.id;

    // Check if booking belongs to user and course
    const bookingResult = await query(
      'SELECT * FROM bookings WHERE id = $1 AND course_id = $2 AND student_id = $3',
      [booking_id, course_id, user_id]
    );
    if (bookingResult.rows.length === 0) {
      throw new AppError('Buchung nicht gefunden oder gehört nicht zu diesem Nutzer/Kurs', 404);
    }

    // Check if user already reviewed this booking
    const existingReview = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND course_id = $2 AND booking_id = $3',
      [user_id, course_id, booking_id]
    );
    if (existingReview.rows.length > 0) {
      throw new AppError('Sie haben diese Buchung bereits bewertet', 409);
    }

    // Insert review
    const result = await query(
      `INSERT INTO reviews (user_id, course_id, booking_id, rating, comment, is_verified, is_public)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       RETURNING *`,
      [user_id, course_id, booking_id, rating, comment]
    );

    res.status(201).json({
      message: 'Bewertung erfolgreich gespeichert',
      review: result.rows[0],
    });
  })
);

// GET /api/reviews/course/:courseId - Get all reviews for a course
router.get('/course/:courseId', asyncHandler(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  if (isNaN(courseId)) {
    throw validationError('Ungültige Kurs-ID');
  }
  const result = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.course_id = $1
     ORDER BY r.created_at DESC`,
    [courseId]
  );
  res.json({ reviews: result.rows });
}));

export default router; 