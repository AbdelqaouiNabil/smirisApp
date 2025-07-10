import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';

// Erweitere Request Interface für user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

// JWT Token-Authentifizierung
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Zugriff verweigert. Token erforderlich.' 
      });
    }

    const secret = process.env.JWT_SECRET || 'germansphere_secret_key_2024';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Überprüfe, ob der Benutzer noch existiert und aktiv ist
    const userResult = await query(
      'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Ungültiger Token. Benutzer nicht gefunden.' 
      });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Konto ist deaktiviert.' 
      });
    }

    // Füge Benutzerinformationen zur Request hinzu
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Token-Authentifizierung fehlgeschlagen:', error);
    return res.status(403).json({ 
      error: 'Ungültiger oder abgelaufener Token.' 
    });
  }
};

// Rollenbasierte Autorisierung
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentifizierung erforderlich.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Unzureichende Berechtigung für diese Aktion.',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Admin-only Middleware
export const requireAdmin = requireRole(['admin']);

// School-Admin Middleware (Schule kann ihre eigenen Daten verwalten)
export const requireSchoolOrAdmin = requireRole(['school', 'admin']);

// Tutor-only Middleware
export const requireTutorOrAdmin = requireRole(['tutor', 'admin']);

// Optional Token (für öffentliche Endpunkte mit optionaler Authentifizierung)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const secret = process.env.JWT_SECRET || 'germansphere_secret_key_2024';
      const decoded = jwt.verify(token, secret) as JwtPayload;

      const userResult = await query(
        'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        req.user = userResult.rows[0];
      }
    }

    next();
  } catch (error) {
    // Fehler ignorieren bei optionaler Authentifizierung
    next();
  }
};

// Token generieren
export const generateToken = (user: { id: number; email: string; role: string; name: string }): string => {
  const secret = process.env.JWT_SECRET || 'germansphere_secret_key_2024';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn }
  );
};

// Refresh Token generieren
export const generateRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'germansphere_refresh_secret_2024';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
};