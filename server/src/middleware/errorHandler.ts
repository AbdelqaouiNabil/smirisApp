import { Request, Response, NextFunction } from 'express';

// Custom Error-Klasse
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Globaler Error Handler
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Ein unerwarteter Fehler ist aufgetreten';

  // Wenn es sich um einen AppError handelt
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // PostgreSQL Fehler
  else if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Datensatz bereits vorhanden';
  }
  else if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Ungültige Referenz zu verknüpften Daten';
  }
  else if (error.message.includes('not null constraint')) {
    statusCode = 400;
    message = 'Erforderliche Felder fehlen';
  }

  // JWT Fehler
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Ungültiger Token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token ist abgelaufen';
  }

  // Validation Fehler
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Eingabedaten sind ungültig';
  }

  // Log all errors for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user
  });

  // Log error (außer bei 4xx Client-Fehlern)
  // if (statusCode >= 500) {
  //   console.error('Server Error:', {
  //     message: error.message,
  //     stack: error.stack,
  //     url: req.url,
  //     method: req.method,
  //     body: req.body,
  //     user: req.user
  //   });
  // }

  // Response senden
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: error.message
    })
  });
};

// Async Handler Wrapper (vermeidet try-catch in jedem Controller)
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} nicht gefunden`, 404);
  next(error);
};

// Validation Error Handler
export const validationError = (message: string) => {
  return new AppError(message, 400);
};

// Unauthorized Error
export const unauthorizedError = (message: string = 'Nicht autorisiert') => {
  return new AppError(message, 401);
};

// Forbidden Error
export const forbiddenError = (message: string = 'Zugriff verweigert') => {
  return new AppError(message, 403);
};

// Not Found Error
export const notFoundError = (message: string = 'Ressource nicht gefunden') => {
  return new AppError(message, 404);
};

// Conflict Error
export const conflictError = (message: string = 'Konflikt bei der Anfrage') => {
  return new AppError(message, 409);
};