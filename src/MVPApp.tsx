import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ComparisonProvider } from './contexts/ComparisonContext'
import MVPNavbar from './components/Layout/MVPNavbar'
import Footer from './components/Layout/Footer'
import { Toaster } from './components/ui/toaster'
import { ErrorBoundary } from './components/ErrorBoundary'

// MVP Pages
import MVPHomepage from './pages/MVPHomepage'
import ComparisonHub from './pages/ComparisonHub'
import TutorRegistrationPage from './pages/TutorRegistrationPage'
import TutorDashboard from './pages/TutorDashboard'
import StudentTutorDashboard from './pages/StudentTutorDashboard'
import TutorProfileCompletePage from './pages/TutorProfileCompletePage';

// Existing Pages (simplified for MVP)
import TutorsPage from './pages/TutorsPage'
import SchoolsPage from './pages/SchoolsPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import SchoolDashboard from './pages/SchoolDashboard'
import ComparisonPage from './pages/ComparisonPage'

import './App.css'

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
                  <Route path="/tutor-anmeldung" element={<TutorRegistrationPage />} />
                  <Route path="/tutor-registration" element={<TutorRegistrationPage />} />
                  <Route path="/tutor-dashboard" element={<TutorDashboard />} />
                  <Route path="/student-tutor-dashboard" element={<StudentTutorDashboard />} />
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

export default MVPApp
