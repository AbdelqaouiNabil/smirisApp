import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, 
  Calendar, 
  Clock, 
  Euro, 
  Star, 
  MessageCircle, 
  Video, 
  Phone, 
  MapPin, 
  BookOpen, 
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Users
} from 'lucide-react'
import { bookingsApi, tutorsApi, Tutor, CourseBooking, API_BASE_URL } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface TutorBooking {
  id: number
  tutorId: number // Use camelCase everywhere
  tutor: Tutor
  date: string
  time: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  price: number
  subject: string
  notes: string
  meetingLink?: string
  paymentStatus: 'paid' | 'pending' | 'refunded'
  createdAt: string
  isRecurring: boolean
  recurringPattern?: string
}

interface TutorStats {
  totalBookings: number
  activeBookings: number
  completedSessions: number
  totalSpent: number
  averageRating: number
  favoriteTutor?: string
}

export default function StudentTutorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  
  const [tutorBookings, setTutorBookings] = useState<TutorBooking[]>([])
  const [courseBookings, setCourseBookings] = useState<CourseBooking[]>([])
  const [activeTab, setActiveTab] = useState<'tutors' | 'courses'>('tutors')
  const [stats, setStats] = useState<TutorStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedSessions: 0,
    totalSpent: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTutor, setSelectedTutor] = useState<TutorBooking | null>(null)
  const [previousBookingCount, setPreviousBookingCount] = useState(0)
  const [hasNewBookings, setHasNewBookings] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<TutorBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);

  // Add state for course review modal
  const [courseReviewModalOpen, setCourseReviewModalOpen] = useState(false);
  const [reviewCourseBooking, setReviewCourseBooking] = useState<CourseBooking | null>(null);
  const [courseReviewRating, setCourseReviewRating] = useState(0);
  const [courseReviewComment, setCourseReviewComment] = useState('');
  const [submittingCourseReview, setSubmittingCourseReview] = useState(false);

  // Memoize the loadTutorBookings function to prevent unnecessary re-renders
  const loadTutorBookings = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    
    try {
      const [bookingsRes, tutorsRes, courseBookingsRes] = await Promise.all([
        bookingsApi.getAll(),
        tutorsApi.getAll(),
        bookingsApi.getStudentCourses()
      ])
      const tutorBookings = (bookingsRes.bookings || []).map((booking: any) => {
        const tutor = (tutorsRes.tutors || []).find((t: Tutor) => t.id === booking.tutor_id)
        return {
          ...booking,
          tutorId: booking.tutor_id, // Normalize to camelCase
          tutor: tutor || {
            id: booking.tutor_id,
            name: booking.tutor_name || 'Unknown Tutor',
            bio: 'Tutor information not available',
            hourly_rate: booking.tutor_rate || booking.total_price,
            rating: 0,
            review_count: 0,
            specializations: [],
            languages: ['German'],
            is_verified: false
          }
        }
      })
      setTutorBookings(tutorBookings)
      setCourseBookings(courseBookingsRes.courseBookings || [])
      calculateStats(tutorBookings)
      
      // Check for new bookings and show notification
      if (!showLoading && tutorBookings.length > previousBookingCount && previousBookingCount > 0) {
        const newBookings = tutorBookings.length - previousBookingCount
        setHasNewBookings(true)
        toast({
          title: "Neue Buchungen verfügbar!",
          description: `${newBookings} neue Tutor-Buchung${newBookings > 1 ? 'en' : ''} wurde${newBookings > 1 ? 'n' : ''} hinzugefügt.`,
        })
      }
      
      // Update previous booking count
      setPreviousBookingCount(tutorBookings.length)
      
      // Show success message if refreshing
      if (!showLoading) {
        toast({
          title: "Daten aktualisiert",
          description: "Ihre Tutor-Buchungen wurden erfolgreich aktualisiert.",
        })
      }
    } catch (error) {
      console.error('Error loading tutor bookings:', error)
      toast({
        title: "Fehler beim Laden der Daten",
        description: "Ihre Tutor-Buchungen konnten nicht geladen werden.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, toast])

  // Load data on component mount and when user changes
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadTutorBookings(true)
  }, [user, navigate, loadTutorBookings])

  // Listen for navigation events (when user comes back from booking a tutor)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when user returns to the page
      if (user) {
        loadTutorBookings(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, loadTutorBookings])

  // Refresh data when user navigates back to this page
  useEffect(() => {
    if (location.pathname === '/student-tutor-dashboard' && user) {
      loadTutorBookings(false)
    }
  }, [location.pathname, user, loadTutorBookings])

  // Auto-refresh every 30 seconds when the page is active
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // Only refresh if the page is visible and user is on this dashboard
      if (document.visibilityState === 'visible' && location.pathname === '/student-tutor-dashboard') {
        loadTutorBookings(false)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, location.pathname, loadTutorBookings])

  const calculateStats = (bookings: TutorBooking[]) => {
    const totalBookings = bookings.length
    const activeBookings = bookings.filter(b => 
      ['confirmed', 'pending'].includes(b.status) && 
      new Date(b.date) >= new Date()
    ).length
    const completedSessions = bookings.filter(b => 
      b.status === 'completed' || new Date(b.date) < new Date()
    ).length
    const totalSpent = bookings.reduce((sum, b) => sum + b.price, 0)
    const averageRating = bookings.length > 0 
      ? bookings.reduce((sum, b) => sum + (b.tutor.rating || 0), 0) / bookings.length 
      : 0

    setStats({
      totalBookings,
      activeBookings,
      completedSessions,
      totalSpent,
      averageRating
    })
  }

  const filteredBookings = tutorBookings.filter(booking => {
    const matchesSearch = booking.tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bestätigt'
      case 'pending': return 'Ausstehend'
      case 'cancelled': return 'Storniert'
      case 'completed': return 'Abgeschlossen'
      default: return status
    }
  }

  const handleBookNewTutor = () => {
    navigate('/tutoren')
  }

  const handleViewTutorProfile = (tutorId: number) => {
    navigate(`/tutoren?tutor=${tutorId}`)
  }

  const handleJoinSession = (booking: TutorBooking) => {
    if (booking.meetingLink) {
      window.open(booking.meetingLink, '_blank')
    } else {
      toast({
        title: "Kein Meeting-Link verfügbar",
        description: "Bitte kontaktieren Sie Ihren Tutor für den Meeting-Link.",
        variant: "destructive"
      })
    }
  }

  const handleContactTutor = (booking: TutorBooking) => {
    // This would typically open a messaging interface
    toast({
      title: "Nachricht senden",
      description: `Nachrichtenfunktion für ${booking.tutor.name} wird implementiert.`,
    })
  }

  const handleRefreshData = () => {
    setHasNewBookings(false) // Clear the new bookings indicator
    loadTutorBookings(false)
  }

  const handleOpenReviewModal = (booking: TutorBooking) => {
    console.log('Opening review modal for booking:', booking);
    setReviewBooking(booking);
    setReviewRating(0);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setReviewBooking(null);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking || !reviewRating) return;
    const tutorId = reviewBooking.tutor?.id || reviewBooking.tutorId;
    console.log('Submitting review for tutorId:', tutorId, 'booking:', reviewBooking);
    if (!tutorId) {
      toast({ title: 'Error', description: 'Tutor ID is missing. Cannot submit review.', variant: 'destructive' });
      return;
    }
    setSubmittingReview(true);
    try {
      // Prefer using the API client if available
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tutors/${tutorId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!response.ok) throw new Error('Review submission failed');
      setReviewedBookings((prev) => [...prev, reviewBooking.id]);
      toast({ title: 'Thank you for your review!' });
      handleCloseReviewModal();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not submit review', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handler to mark course as completed
  const handleMarkCourseCompleted = async (booking: CourseBooking) => {
    try {
      await bookingsApi.updateStatus(booking.id, 'completed');
      toast({ title: 'Kurs als abgeschlossen markiert!' });
      setReviewCourseBooking(booking);
      setCourseReviewModalOpen(true);
      // Refresh bookings
      loadTutorBookings(false);
    } catch (error) {
      toast({ title: 'Fehler', description: 'Kurs konnte nicht abgeschlossen werden.', variant: 'destructive' });
    }
  };

  // Handler to submit course review
  const handleSubmitCourseReview = async () => {
    if (!reviewCourseBooking || !courseReviewRating) return;
    setSubmittingCourseReview(true);
    try {
      // Assuming apiClient is available or using fetch directly
      // For simplicity, using fetch directly for now, adjust if apiClient is defined
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          course_id: reviewCourseBooking.course_id,
          booking_id: reviewCourseBooking.id,
          rating: courseReviewRating,
          comment: courseReviewComment,
        }),
      });
      if (!response.ok) throw new Error('Course review submission failed');
      toast({ title: 'Danke für Ihre Bewertung!' });
      setCourseReviewModalOpen(false);
      setReviewCourseBooking(null);
      setCourseReviewRating(0);
      setCourseReviewComment('');
      // Optionally refresh bookings
      loadTutorBookings(false);
    } catch (error) {
      toast({ title: 'Fehler', description: 'Bewertung konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSubmittingCourseReview(false);
    }
  };

  const renderCourses = () => {
    const sortedCourseBookings = courseBookings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meine Kurse</h2>
          <button
            onClick={() => navigate('/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neuen Kurs buchen
          </button>
        </div>

        {sortedCourseBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine Kursbuchungen</h3>
            <p className="text-gray-600 mb-6">
              Entdecken Sie unsere Kursangebote und beginnen Sie mit dem strukturierten Lernen!
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Kurse durchsuchen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourseBookings.map((courseBooking) => (
              <div key={courseBooking.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {courseBooking.course_image && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={courseBooking.course_image}
                      alt={courseBooking.course_title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      courseBooking.course_level === 'A1' || courseBooking.course_level === 'A2' ? 'bg-green-100 text-green-800' :
                      courseBooking.course_level === 'B1' || courseBooking.course_level === 'B2' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {courseBooking.course_level}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      courseBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      courseBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      courseBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {courseBooking.status === 'confirmed' ? 'Bestätigt' :
                       courseBooking.status === 'pending' ? 'Ausstehend' :
                       courseBooking.status === 'cancelled' ? 'Storniert' : 'Abgeschlossen'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {courseBooking.course_title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {courseBooking.course_description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{courseBooking.school_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{courseBooking.school_location}</span>
                    </div>
                    {courseBooking.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{courseBooking.schedule}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {courseBooking.duration_weeks} Wochen • {courseBooking.hours_per_week} Stunden/Woche
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      {courseBooking.total_price} {courseBooking.currency}
                    </div>
                    <div className="flex space-x-2">
                      {courseBooking.meeting_link && (
                        <button
                          onClick={() => window.open(courseBooking.meeting_link, '_blank')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <Video className="w-3 h-3 mr-1" />
                          Join
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/courses/${courseBooking.course_id}`)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Details
                      </button>
                      {courseBooking.status === 'confirmed' && (
                        <button
                          onClick={() => handleMarkCourseCompleted(courseBooking)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 ml-2"
                        >
                          Als abgeschlossen markieren
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {courseBooking.tutor_name && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>Tutor: {courseBooking.tutor_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Ihre Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Tutoren und Kurse</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefreshData}
                disabled={refreshing}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium flex items-center transition-colors disabled:opacity-50 relative"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Aktualisiere...' : 'Aktualisieren'}
                {hasNewBookings && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <button
                onClick={() => activeTab === 'tutors' ? handleBookNewTutor() : navigate('/courses')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                {activeTab === 'tutors' ? 'Neuen Tutor buchen' : 'Neuen Kurs buchen'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('tutors')}
                className={`${
                  activeTab === 'tutors'
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <User className="w-4 h-4 mr-2" />
                Meine tutor
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Meine Kurse
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt Buchungen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktive Buchungen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Euro className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt Ausgaben</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ø Bewertung</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'tutors' && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Tutor oder Thema suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Alle Status</option>
                    <option value="confirmed">Bestätigt</option>
                    <option value="pending">Ausstehend</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tutor Bookings List */}
            <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Keine Buchungen gefunden' : 'Noch keine Tutor-Buchungen'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Versuchen Sie andere Suchbegriffe oder Filter.' 
                  : 'Buchen Sie Ihren ersten Tutor und beginnen Sie mit dem Lernen!'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleBookNewTutor}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Ersten Tutor buchen
                </button>
              )}
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.tutor.name}
                          </h3>
                          {booking.tutor.is_verified && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verifiziert
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            {booking.tutor.rating || 0} ({booking.tutor.review_count || 0} Bewertungen)
                          </div>
                          <div className="flex items-center">
                            <Euro className="w-4 h-4 mr-1" />
                            {booking.tutor.hourly_rate}/Stunde
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            Online
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Nächste Sitzung</p>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {new Date(booking.date).toLocaleDateString('de-DE')} um {booking.time}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Thema</p>
                            <p className="text-sm text-gray-600">{booking.subject}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.paymentStatus === 'paid' ? 'Bezahlt' : 'Zahlung ausstehend'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">€{booking.price}</p>
                        <p className="text-sm text-gray-600">{booking.duration} Min.</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                    {booking.status === 'confirmed' && new Date(booking.date) >= new Date() && (
                      <button
                        onClick={() => handleJoinSession(booking)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Sitzung beitreten
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleContactTutor(booking)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Nachricht senden
                    </button>

                    <button
                      onClick={() => handleViewTutorProfile(booking.tutorId)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profil anzeigen
                    </button>

                    {booking.status === 'pending' && (
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Stornieren
                      </button>
                    )}
                    {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                      <button
                        onClick={() => handleOpenReviewModal(booking)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Leave a Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}

        {activeTab === 'courses' && renderCourses()}
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onClose={handleCloseReviewModal}>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <div className="flex items-center space-x-2 mb-4">
            {[1,2,3,4,5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 cursor-pointer ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setReviewRating(star)}
              />
            ))}
          </div>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Write your feedback..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <button onClick={handleCloseReviewModal} className="px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmitReview}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={submittingReview || !reviewRating}
          >
            Submit
          </button>
        </DialogActions>
      </Dialog>

      {/* Course Review Modal */}
      <Dialog open={courseReviewModalOpen} onClose={() => setCourseReviewModalOpen(false)}>
        <DialogTitle>Kurs bewerten</DialogTitle>
        <DialogContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Bewertung *</label>
            <div className="flex space-x-1 mb-2">
              {[1,2,3,4,5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 cursor-pointer ${star <= courseReviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  onClick={() => setCourseReviewRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              placeholder="Ihre Erfahrung mit diesem Kurs..."
              value={courseReviewComment}
              onChange={e => setCourseReviewComment(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setCourseReviewModalOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2"
            disabled={submittingCourseReview}
          >Abbrechen</button>
          <button
            onClick={handleSubmitCourseReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={submittingCourseReview || courseReviewRating === 0 || !courseReviewComment.trim()}
          >Bewertung abgeben</button>
        </DialogActions>
      </Dialog>
    </div>
  )
} 