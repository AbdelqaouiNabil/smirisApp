
## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbdelqaouiNabil/smirisApp.git
   cd smirisApp
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment example
   cp env.config.example .env
   
   # Edit .env with your configuration
   # Database connection, JWT secrets, etc.
   ```

4. **Set up the database**
   ```bash
   cd server
   # Run database migrations
   npm run db:migrate
   
   # Seed the database (optional)
   npm run db:seed
   cd ..
   ```

5. **Start the development servers**
   ```bash
   # Start backend server (from server directory)
   cd server
   npm run dev
   
   # Start frontend server (from root directory)
   npm run dev
   ```

### Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## �� Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smiris_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server
PORT=5000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Key Tables
- **users**: User accounts and authentication
- **schools**: Language school information
- **tutors**: Tutor profiles and credentials
- **courses**: Course offerings and details
- **bookings**: Student bookings and reservations
- **payments**: Payment transactions
- **visa_services**: Visa application services

## 🔐 Authentication & Authorization

- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (student, tutor, school, admin)
- **Protected routes** for sensitive operations
- **Token refresh** mechanism for seamless user experience

## 🌐 Internationalization

The platform supports multiple languages:
- **German** (Deutsch)
- **French** (Français)
- **Arabic** (العربية)

Language files are located in `src/i18n/locales/`

## 📱 Responsive Design

The platform is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security Features

- **CORS protection** for cross-origin requests
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Secure file uploads** with type checking
- **JWT token security** with expiration
- **SQL injection prevention** with parameterized queries

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

### Docker Deployment

```bash
# Build production image
docker build -t smiris-app .

# Run container
docker run -p 3000:3000 -p 5000:5000 smiris-app
```

## 📈 Recent Updates

### Latest Features (v1.0.2)
- ✅ Admin panel: Activate/Deactivate users, schools, and courses directly from the UI
- ✅ Hard delete (permanent removal) for users, including related data cleanup
- ✅ Improved backend type safety (Request, Response) and fixed all linter errors
- ✅ User-friendly error handling for admin actions (e.g., cannot delete course with active bookings)
- ✅ All changes fully integrated and pushed to GitHub
- ✅ Review system implemented: Students can leave reviews for schools and bookings, with payment step temporarily bypassed for testing

### Previous Updates (v1.0.0)
- ✅ Course editing functionality in School Dashboard
- ✅ Real data integration for Tutor and School dashboards
- ✅ Authentication token handling improvements
- ✅ Course creation for tutors with modal forms
- ✅ Login requirement for tutor booking and comparison
- ✅ CORS and rate limiting fixes
- ✅ Enhanced error handling and validation
- ✅ Improved navigation and routing

### Major Changes (July 2025)
- Added PATCH /api/admin/tutors/:id/verify for admin tutor verification
- Fixed frontend to use is_verified in PATCH requests
- Ensured dashboard and admin panel use correct tutor/user ID logic
- Added and fixed GET /api/tutors/:id backend route for tutor details
- Added debug logging to API client for GET requests
- General bug fixes for tutor registration, dashboard, and admin panel
- Improved error handling and ID mapping between users and tutors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Abdelqaoui Nabil** - Full Stack Developer
- **Smiris Germany Team** - Language Learning Platform

## 📞 Support

For support and questions:
- Email: support@smiris-germany.com
- GitHub Issues: [Create an issue](https://github.com/AbdelqaouiNabil/smirisApp/issues)

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **API Documentation**: [Coming Soon]
- **Contributing Guidelines**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Made with ❤️ for language learners in Germany**
