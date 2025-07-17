import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { generateToken, generateRefreshToken, authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError, validationError } from '../middleware/errorHandler';

const router = express.Router();

// Registrierung
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name muss zwischen 2 und 100 Zeichen lang sein'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
  body('role')
    .optional()
    .isIn(['student', 'tutor', 'school'])
    .withMessage('Ungültige Rolle')
], asyncHandler(async (req: Request, res: Response) => {
  // Validierungsfehler prüfen
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig: ' + errors.array().map(e => e.msg).join(', '));
  }

  const { name, email, password, role = 'student', phone, location } = req.body;

  // Prüfen, ob E-Mail bereits existiert
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('E-Mail-Adresse ist bereits registriert', 409);
  }

  // Passwort hashen
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Benutzer erstellen
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, location)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, uuid, name, email, role, created_at`,
    [name, email, passwordHash, role, phone, location]
  );

  const user = result.rows[0];

  // Token generieren
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  const refreshToken = generateRefreshToken(user.id);

  res.status(201).json({
    message: 'Registrierung erfolgreich',
    user: {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    },
    access_token: token,
    refresh_token: refreshToken
  });
}));

// Login
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .notEmpty()
    .withMessage('Passwort erforderlich')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { email, password } = req.body;

  // Benutzer finden
  const result = await query(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('E-Mail oder Passwort ist falsch', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError('Konto ist deaktiviert', 401);
  }

  // Passwort überprüfen
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('E-Mail oder Passwort ist falsch', 401);
  }

  // Login-Zeit aktualisieren
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Token generieren
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  const refreshToken = generateRefreshToken(user.id);

  res.json({
    message: 'Login erfolgreich',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    access_token: token,
    refresh_token: refreshToken
  });
}));

// Profil abrufen
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, uuid, name, email, role, phone, location, avatar_url, 
            language_preference, is_verified, created_at, last_login
     FROM users WHERE id = $1`,
    [req.user!.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Benutzer nicht gefunden', 404);
  }

  res.json({
    user: result.rows[0]
  });
}));

// Profil aktualisieren
router.put('/profile', [
  authenticateToken,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name muss zwischen 2 und 100 Zeichen lang sein'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Ungültige Telefonnummer'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Standort zu lang'),
  body('language_preference')
    .optional()
    .isIn(['de', 'fr', 'ar'])
    .withMessage('Ungültige Sprachpräferenz')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { name, phone, location, language_preference } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (location !== undefined) {
    updates.push(`location = $${paramIndex++}`);
    values.push(location);
  }
  if (language_preference !== undefined) {
    updates.push(`language_preference = $${paramIndex++}`);
    values.push(language_preference);
  }

  if (updates.length === 0) {
    throw validationError('Keine Aktualisierungen angegeben');
  }

  values.push(req.user!.id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING id, name, email, role, phone, location, language_preference`,
    values
  );

  res.json({
    message: 'Profil erfolgreich aktualisiert',
    user: result.rows[0]
  });
}));

// Passwort ändern
router.put('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Aktuelles Passwort erforderlich'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Neues Passwort muss mindestens 6 Zeichen lang sein')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError('Eingabedaten sind ungültig');
  }

  const { currentPassword, newPassword } = req.body;

  // Aktuelles Passwort überprüfen
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user!.id]
  );

  const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValidPassword) {
    throw new AppError('Aktuelles Passwort ist falsch', 401);
  }

  // Neues Passwort hashen
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Passwort aktualisieren
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, req.user!.id]
  );

  res.json({
    message: 'Passwort erfolgreich geändert'
  });
}));

// Token erneuern
router.post('/refresh-token', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh Token erforderlich', 401);
  }

  // Hier würde normalerweise der Refresh Token validiert
  // Für die Demo vereinfacht
  res.json({
    message: 'Token erneuert',
    token: 'new_token_here'
  });
}));

// Logout (Token invalidieren - in echter App würde man eine Blacklist verwenden)
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  // In einer echten Anwendung würde man hier den Token zur Blacklist hinzufügen
  res.json({
    message: 'Erfolgreich abgemeldet'
  });
}));

export default router;