import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ComparisonProvider } from './contexts/ComparisonContext'
import MVPNavbar from './components/Layout/MVPNavbar'
import Footer from './components/Layout/Footer'
import { Toaster } from './components/ui/toaster'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'

// MVP Pages
import MVPHomepage from './pages/MVPHomepage'
import ComparisonHub from './pages/ComparisonHub'
import TutorRegistrationPage from './pages/TutorRegistrationPage'
import TutorDashboard from './pages/TutorDashboard'
import StudentTutorDashboard from './pages/StudentTutorDashboard'
import TutorProfileCompletePage from './pages/TutorProfileCompletePage';
import AdminPanel from './pages/AdminPanel'

// Existing Pages (simplified for MVP)
import TutorsPage from './pages/TutorsPage'
import SchoolsPage from './pages/SchoolsPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import SchoolDashboard from './pages/SchoolDashboard'
import ComparisonPage from './pages/ComparisonPage'
import VisaServicesPage from './pages/VisaServicesPage';
import AuthCallback from './pages/AuthCallback'; // Import the new component

import './App.css'
import { useAuth } from './contexts/AuthContext'

function MVPApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ComparisonProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
              <MVPNavbar />
              <main>
                <Routes>
                  {/* MVP Core Routes */}
                  <Route path="/" element={<MVPHomepage />} />
                  <Route path="/vergleichen" element={<ComparisonPage />} />
                  <Route path="/comparison-hub" element={<ComparisonPage />} />
                  
                  {/* Tutor System - MVP Focus */}
                  <Route path="/tutoren" element={<TutorsPage />} />
                  <Route path="/tutors" element={<TutorsPage />} />
                  <Route path="/visa-services" element={<VisaServicesPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/tutor-anmeldung" element={<TutorRegistrationPage />} />
                  <Route path="/tutor-registration" element={<TutorRegistrationPage />} />
                  <Route path="/tutor-dashboard" element={<ProtectedRoute><TutorDashboard /></ProtectedRoute>} />
                  <Route path="/student-tutor-dashboard" element={<ProtectedRoute><StudentTutorDashboard /></ProtectedRoute>} />
                  <Route path="/tutor-profile-complete" element={<TutorProfileCompletePage />} />
                  
                  {/* Schools - Simplified */}
                  <Route path="/schulen" element={<SchoolsPage />} />
                  <Route path="/schools" element={<SchoolsPage />} />
                  <Route path="/school-dashboard" element={<SchoolDashboard />} />
                  
                  {/* Courses */}
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/kurse" element={<CoursesPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/kurse/:id" element={<CourseDetailPage />} />
                  
                  {/* Booking System */}
                  <Route path="/booking/:type/:id" element={<BookingPage />} />
                  <Route path="/buchen/:type/:id" element={<BookingPage />} />
                  
                  {/* Comparison & Details */}
                  <Route path="/vergleich" element={<ComparisonPage />} />
                  <Route path="/detaillierter-vergleich" element={<ComparisonPage />} />
                  <Route path="/comparison" element={<ComparisonPage />} />
                  
                  {/* Authentication */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/anmelden" element={<LoginPage />} />
                  
                  {/* Admin Panel */}
                  <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                  
                  {/* Catch-all redirect to comparison hub */}
                  <Route path="*" element={<ComparisonHub />} />
                </Routes>
              </main>
              <Footer />
              <Toaster />
            </div>
          </Router>
        </ComparisonProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function AdminPanelGuard() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">Zugriff verweigert</div>;
  }
  return <AdminPanel />;
}

export default MVPApp
