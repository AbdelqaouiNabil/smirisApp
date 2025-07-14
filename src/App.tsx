import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ComparisonProvider } from './contexts/ComparisonContext'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import { Toaster } from './components/ui/toaster'
import Homepage from './pages/Homepage'

import TutorsPage from './pages/TutorsPage'
import SchoolsPage from './pages/SchoolsPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import VisaServicesPage from './pages/VisaServicesPage'
import ComparisonPage from './pages/ComparisonPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentTutorDashboard from './pages/StudentTutorDashboard'
import StudentRegistrationPage from './pages/StudentRegistrationPage'
import AdminPanel from './pages/AdminPanel'
import SchoolDashboard from './pages/SchoolDashboard'
import EnhancedSchoolDashboard from './pages/EnhancedSchoolDashboard'
import SchoolRegistrationPage from './pages/SchoolRegistrationPage'
import BookingPage from './pages/BookingPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ComparisonProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Homepage />} />

                <Route path="/tutors" element={<TutorsPage />} />
                <Route path="/tutoren" element={<TutorsPage />} />
                <Route path="/schools" element={<SchoolsPage />} />
                <Route path="/schulen" element={<SchoolsPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/kurse" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/kurse/:id" element={<CourseDetailPage />} />
                <Route path="/vergleich" element={<ComparisonPage />} />
                <Route path="/vergleichen" element={<ComparisonPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/visa" element={<VisaServicesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/student-tutor-dashboard" element={<StudentTutorDashboard />} />
                
                {/* Rollenbasierte Routen */}
                <Route path="/student-registration" element={<StudentRegistrationPage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/school-dashboard" element={<SchoolDashboard />} />
                <Route path="/enhanced-school-dashboard" element={<EnhancedSchoolDashboard />} />
                
                {/* School Management */}
                <Route path="/school-registration" element={<SchoolRegistrationPage />} />
                <Route path="/sprachschule-anmelden" element={<SchoolRegistrationPage />} />
                
                {/* Booking System */}
                <Route path="/booking/:type/:id" element={<BookingPage />} />
                <Route path="/buchen/:type/:id" element={<BookingPage />} />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </ComparisonProvider>
    </AuthProvider>
  )
}

export default App
