
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails?.[0].value;
        const avatarUrl = photos?.[0].value;

        if (!email) {
          return done(new AppError('Google-Konto hat keine E-Mail-Adresse.', 400), undefined);
        }

        // Check if user already exists
        let userResult = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [id, email]);
        let user = userResult.rows[0];

        if (user) {
          // If user exists but google_id is not set, update it
          if (!user.google_id) {
            const updateResult = await query(
              'UPDATE users SET google_id = $1, avatar_url = $2, is_verified = TRUE WHERE id = $3 RETURNING *',
              [id, avatarUrl, user.id]
            );
            user = updateResult.rows[0];
          }
        } else {
          // If user does not exist, create a new one
          const createResult = await query(
            'INSERT INTO users (name, email, google_id, avatar_url, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [displayName, email, id, avatarUrl, 'student', true]
          );
          user = createResult.rows[0];
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}); 