import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// Import routes
import authRoutes from "./routes/auth";
import schoolRoutes from "./routes/schools";
import courseRoutes from "./routes/courses";
import tutorRoutes, { profileDocumentsRouter } from "./routes/tutors";
import bookingRoutes from "./routes/bookings";
import paymentRoutes from "./routes/payments";
import visaRoutes from "./routes/visa";
import adminRoutes from "./routes/admin";
import reviewsRoutes from "./routes/reviews";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { authenticateToken } from "./middleware/auth";
import passport from "passport";
import session from "express-session";
import "./config/passport"; // Import the passport configuration

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - completely disabled in development
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );
}
// No helmet in development mode to avoid any security restrictions

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Much higher limit in development
  message:
    "Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.",
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    if (req.path === "/health") return true;
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  },
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://ku19mpyoa0.space.minimax.io"]
        : true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

// Register the file upload route BEFORE body parsers
app.use("/api/tutors", profileDocumentsRouter);

// Body parsing middleware (for all other routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session middleware for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_default_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Register the rest of the tutor routes
app.use("/api/tutors", tutorRoutes);

// Logging middleware
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Germansphere SaaS Backend läuft",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", authenticateToken, paymentRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/visa", visaRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);

// Serve uploaded files statically with flexible CORS in development
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    // In development, allow all origins
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    // In production, be more restrictive
    res.header(
      "Access-Control-Allow-Origin",
      "https://ku19mpyoa0.space.minimax.io"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma"
    );
  }
  express.static(uploadsPath)(req, res, next);
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpunkt nicht gefunden",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Germansphere SaaS Backend läuft auf Port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
