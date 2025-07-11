import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Simulated Payment Intent Creation
router.post('/create-payment-intent', [
  body('booking_id')
    .isInt()
    .withMessage('Buchungs-ID erforderlich'),
  body('payment_method')
    .isIn(['card', 'bank_transfer', 'paypal'])
    .withMessage('Ungültige Zahlungsmethode')
], authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { booking_id, payment_method } = req.body;

  // Buchung abrufen und Berechtigung prüfen
  const bookingResult = await query(
    `SELECT b.*, c.title as course_title, t.user_id as tutor_user_id, u.name as tutor_name
     FROM bookings b
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE b.id = $1 AND b.student_id = $2`,
    [booking_id, req.user!.id]
  );

  if (bookingResult.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden oder keine Berechtigung', 404);
  }

  const booking = bookingResult.rows[0];

  // Prüfen, ob Buchung bezahlbar ist
  if (booking.payment_status === 'paid') {
    throw new AppError('Buchung ist bereits bezahlt', 409);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Stornierte Buchungen können nicht bezahlt werden', 400);
  }

  // Generate a simulated payment ID
  const simulatedPaymentId = `SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create payment record
  const paymentResult = await query(
    `INSERT INTO payments 
     (booking_id, user_id, amount, currency, payment_method, transaction_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [booking_id, req.user!.id, booking.total_price, 'EUR', payment_method, simulatedPaymentId, 'pending']
  );

  // Return simulated payment data
  res.json({
    payment_id: paymentResult.rows[0].id,
    transaction_id: simulatedPaymentId,
    amount: booking.total_price,
    currency: 'EUR',
    status: 'pending'
  });
}));

// Simulated Payment Confirmation
router.post('/confirm-payment', [
  body('payment_id').isInt().withMessage('Payment-ID erforderlich'),
  body('transaction_id').isString().withMessage('Transaktions-ID erforderlich')
], authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { payment_id, transaction_id } = req.body;

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update payment status
  await query(
    `UPDATE payments 
     SET status = 'success', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [payment_id, req.user!.id]
  );

  // Update booking status
  const bookingResult = await query(
    `UPDATE bookings b
     SET payment_status = 'paid', 
         status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
         updated_at = CURRENT_TIMESTAMP
     FROM payments p
     WHERE p.booking_id = b.id AND p.id = $1
     RETURNING b.id`,
    [payment_id]
  );

  if (bookingResult.rows.length === 0) {
    throw new AppError('Buchung nicht gefunden', 404);
  }

  res.json({
    message: 'Zahlung erfolgreich bestätigt',
    payment_status: 'success',
    booking_id: bookingResult.rows[0].id
  });
}));

export default router;