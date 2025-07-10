import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { query } from '../database/connection';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Stripe-Client initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
  apiVersion: '2024-11-20.acacia'
});

// Payment Intent erstellen (Stripe)
router.post('/create-payment-intent', [
  body('booking_id')
    .isInt()
    .withMessage('Buchungs-ID erforderlich'),
  body('payment_method')
    .isIn(['stripe', 'paypal', 'cmi', 'wafacash', 'bank_transfer'])
    .withMessage('Ungültige Zahlungsmethode')
], asyncHandler(async (req, res) => {
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

  const amount = Math.round(parseFloat(booking.total_price) * 100); // Betrag in Cents
  const currency = booking.currency?.toLowerCase() || 'eur';

  try {
    if (payment_method === 'stripe') {
      // Stripe Payment Intent erstellen
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          booking_id: booking_id.toString(),
          student_id: req.user!.id.toString(),
          booking_type: booking.booking_type
        },
        description: `Germansphere - ${booking.booking_type === 'course' ? booking.course_title : 
          booking.booking_type === 'tutor' ? `Nachhilfe mit ${booking.tutor_name}` : 'Visa Service'}`
      });

      // Payment-Eintrag in Datenbank erstellen
      const paymentResult = await query(
        `INSERT INTO payments 
         (booking_id, user_id, amount, currency, payment_method, stripe_payment_intent_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [booking_id, req.user!.id, booking.total_price, currency, payment_method, paymentIntent.id, 'pending']
      );

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_id: paymentResult.rows[0].id,
        amount: booking.total_price,
        currency
      });

    } else if (payment_method === 'paypal') {
      // PayPal-Integration (vereinfacht - in echter App würde man PayPal SDK verwenden)
      const paypalOrderId = `PAYPAL_${Date.now()}_${booking_id}`;

      const paymentResult = await query(
        `INSERT INTO payments 
         (booking_id, user_id, amount, currency, payment_method, paypal_order_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [booking_id, req.user!.id, booking.total_price, currency, payment_method, paypalOrderId, 'pending']
      );

      res.json({
        paypal_order_id: paypalOrderId,
        payment_id: paymentResult.rows[0].id,
        amount: booking.total_price,
        currency,
        redirect_url: `${process.env.FRONTEND_URL}/payment/paypal/${paypalOrderId}`
      });
    }

  } catch (error) {
    console.error('Payment Intent creation failed:', error);
    throw new AppError('Zahlung konnte nicht initialisiert werden', 500);
  }
}));

// Payment bestätigen
router.post('/confirm-payment', [
  body('payment_id')
    .isInt()
    .withMessage('Payment-ID erforderlich'),
  body('transaction_id')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Transaktions-ID erforderlich')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { payment_id, transaction_id } = req.body;

  // Payment abrufen
  const paymentResult = await query(
    `SELECT p.*, b.id as booking_id, b.status as booking_status
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     WHERE p.id = $1 AND p.user_id = $2`,
    [payment_id, req.user!.id]
  );

  if (paymentResult.rows.length === 0) {
    throw new AppError('Zahlung nicht gefunden', 404);
  }

  const payment = paymentResult.rows[0];

  if (payment.status === 'success') {
    throw new AppError('Zahlung ist bereits bestätigt', 409);
  }

  try {
    let paymentSuccessful = false;

    if (payment.payment_method === 'stripe' && payment.stripe_payment_intent_id) {
      // Stripe Payment Intent überprüfen
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      paymentSuccessful = paymentIntent.status === 'succeeded';
    } else if (payment.payment_method === 'paypal') {
      // PayPal-Zahlung überprüfen (vereinfacht)
      // In echter App würde man PayPal API verwenden
      paymentSuccessful = transaction_id && transaction_id.length > 0;
    }

    if (paymentSuccessful) {
      // Payment als erfolgreich markieren
      await query(
        `UPDATE payments 
         SET status = 'success', transaction_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [transaction_id, payment_id]
      );

      // Buchung als bezahlt und bestätigt markieren
      await query(
        `UPDATE bookings 
         SET payment_status = 'paid', status = CASE 
           WHEN status = 'pending' THEN 'confirmed' 
           ELSE status 
         END, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [payment.booking_id]
      );

      res.json({
        message: 'Zahlung erfolgreich bestätigt',
        payment_status: 'success',
        booking_id: payment.booking_id
      });

    } else {
      // Payment als fehlgeschlagen markieren
      await query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['failed', payment_id]
      );

      throw new AppError('Zahlung fehlgeschlagen oder nicht autorisiert', 400);
    }

  } catch (error) {
    console.error('Payment confirmation failed:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Zahlungsbestätigung fehlgeschlagen', 500);
  }
}));

// Rückerstattung beantragen
router.post('/refund', [
  body('payment_id')
    .isInt()
    .withMessage('Payment-ID erforderlich'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Grund zu lang'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ungültiger Rückerstattungsbetrag')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { payment_id, reason, amount } = req.body;

  // Payment abrufen
  const paymentResult = await query(
    `SELECT p.*, b.status as booking_status, b.start_date
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     WHERE p.id = $1 AND p.user_id = $2 AND p.status = 'success'`,
    [payment_id, req.user!.id]
  );

  if (paymentResult.rows.length === 0) {
    throw new AppError('Bezahlte Zahlung nicht gefunden', 404);
  }

  const payment = paymentResult.rows[0];

  // Rückerstattungsrichtlinien prüfen
  const startDate = new Date(payment.start_date);
  const now = new Date();
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart < 48) {
    throw new AppError('Rückerstattungen sind nur bis 48 Stunden vor Beginn möglich', 400);
  }

  const refundAmount = amount || parseFloat(payment.amount);
  const refundAmountCents = Math.round(refundAmount * 100);

  try {
    if (payment.payment_method === 'stripe' && payment.stripe_payment_intent_id) {
      // Stripe-Rückerstattung
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: refundAmountCents,
        reason: 'requested_by_customer'
      });

      // Payment-Status aktualisieren
      await query(
        `UPDATE payments 
         SET status = 'refunded', metadata = jsonb_set(
           COALESCE(metadata, '{}'), 
           '{refund_id}', 
           to_jsonb($1::text)
         ), updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [refund.id, payment_id]
      );

    } else if (payment.payment_method === 'paypal') {
      // PayPal-Rückerstattung (vereinfacht)
      await query(
        `UPDATE payments 
         SET status = 'refunded', metadata = jsonb_set(
           COALESCE(metadata, '{}'), 
           '{refund_reason}', 
           to_jsonb($1::text)
         ), updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason || 'Customer request', payment_id]
      );
    }

    // Buchung entsprechend aktualisieren
    await query(
      `UPDATE bookings 
       SET payment_status = 'refunded', status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [payment.booking_id]
    );

    res.json({
      message: 'Rückerstattung erfolgreich beantragt',
      refund_amount: refundAmount
    });

  } catch (error) {
    console.error('Refund failed:', error);
    throw new AppError('Rückerstattung konnte nicht verarbeitet werden', 500);
  }
}));

// Zahlungshistorie abrufen
router.get('/history', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT 
      p.id, p.amount, p.currency, p.payment_method, p.status, p.transaction_id, p.created_at,
      b.id as booking_id, b.booking_type, b.start_date,
      c.title as course_title,
      u.name as tutor_name,
      vs.name as visa_service_name
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     LEFT JOIN courses c ON b.course_id = c.id
     LEFT JOIN tutors t ON b.tutor_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     LEFT JOIN visa_services vs ON b.booking_type = 'visa'
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [req.user!.id]
  );

  res.json({
    payments: result.rows
  });
}));

// Zahlungsstatistiken (nur für Admins und Anbieter)
router.get('/stats', asyncHandler(async (req, res) => {
  let whereCondition = '';
  const queryParams: any[] = [];

  if (req.user!.role === 'tutor') {
    // Tutoren sehen nur ihre Einnahmen
    const tutorResult = await query(
      'SELECT id FROM tutors WHERE user_id = $1',
      [req.user!.id]
    );
    if (tutorResult.rows.length > 0) {
      whereCondition = 'WHERE b.tutor_id = $1';
      queryParams.push(tutorResult.rows[0].id);
    }
  } else if (req.user!.role === 'school') {
    // Schulen sehen nur ihre Einnahmen
    whereCondition = 'WHERE c.school_id IN (SELECT id FROM schools WHERE owner_id = $1)';
    queryParams.push(req.user!.id);
  } else if (req.user!.role !== 'admin') {
    throw new AppError('Keine Berechtigung für Zahlungsstatistiken', 403);
  }

  const statsResult = await query(
    `SELECT 
      COUNT(*) as total_payments,
      COUNT(CASE WHEN p.status = 'success' THEN 1 END) as successful_payments,
      COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments,
      COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_payments,
      SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END) as total_refunded,
      COUNT(CASE WHEN p.payment_method = 'stripe' THEN 1 END) as stripe_payments,
      COUNT(CASE WHEN p.payment_method = 'paypal' THEN 1 END) as paypal_payments
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     LEFT JOIN courses c ON b.course_id = c.id
     ${whereCondition}`,
    queryParams
  );

  res.json({
    stats: statsResult.rows[0]
  });
}));

// Stripe Webhook für automatische Payment-Updates
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError('Stripe Webhook Secret nicht konfiguriert', 500);
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Payment in Datenbank als erfolgreich markieren
        await query(
          `UPDATE payments 
           SET status = 'success', transaction_id = $1, updated_at = CURRENT_TIMESTAMP
           WHERE stripe_payment_intent_id = $2`,
          [paymentIntent.id, paymentIntent.id]
        );

        // Buchung aktualisieren
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          await query(
            `UPDATE bookings 
             SET payment_status = 'paid', status = CASE 
               WHEN status = 'pending' THEN 'confirmed' 
               ELSE status 
             END, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [parseInt(bookingId)]
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        
        await query(
          'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = $2',
          ['failed', failedIntent.id]
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error}`);
  }
}));

export default router;