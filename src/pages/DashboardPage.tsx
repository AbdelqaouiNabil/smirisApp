import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/de'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Users, FileText, Calendar, TrendingUp, Award, Clock, Euro, Settings, Bell, Star, CheckCircle, XCircle, Play, MapPin, User } from 'lucide-react'
import { bookingsApi, Tutor, tutorsApi, CourseBooking } from '../lib/api'

// Lokalisierung
moment.locale('de')
const localizer = momentLocalizer(moment)

interface DashboardStats {
  totalCourses: number
  enrolledCourses: number
  completedCourses: number
  upcomingLessons: number
  totalSpent: number
  certificates: number
}

interface Booking {
  id: number
  studentId?: number
  tutorId?: number
  courseId?: number
  schoolId?: number
  type: 'tutor' | 'course'
  date: string
  time: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled'
  price: number
  subject: string
  notes: string
  createdAt: string
  isRecurring: boolean
  recurringPattern?: string
  meetingLink?: string
  paymentStatus: 'paid' | 'pending' | 'refunded'
  cancelledAt?: string
  cancelReason?: string
}



interface CalendarEvent {
  title: string
  start: Date
  end: Date
  resource?: any
}

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Get tab from URL query parameter
  const queryParams = new URLSearchParams(location.search)
  const tabFromUrl = queryParams.get('tab')
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview')
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    navigate(`/dashboard?tab=${tab}`, { replace: true })
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    upcomingLessons: 0,
    totalSpent: 0,
    certificates: 0
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [courseBookings, setCourseBookings] = useState<CourseBooking[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [bookingsRes, tutorsRes, courseBookingsRes] = await Promise.all([
                  bookingsApi.getAll(),
          tutorsApi.getAll(),
          user?.role === 'student' ? bookingsApi.getStudentCourses() : Promise.resolve({ courseBookings: [] })
        ])
        
        const jsonBookingsData = bookingsRes.bookings || []
        const tutorsData = tutorsRes.tutors || []
        const courseBookingsData = courseBookingsRes.courseBookings || []
        
        // Lade localStorage-Buchungen
        const localBookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
        
        // Kombiniere JSON-Buchungen mit localStorage-Buchungen
        const allBookings = [...jsonBookingsData, ...localBookings]
        
        setBookings(allBookings)
        setCourseBookings(courseBookingsData)
        setTutors(tutorsData)
        
        // Convert bookings to calendar events
        const events = allBookings
          .filter((booking: Booking) => 
            user?.role === 'student' ? booking.studentId === Number(user.id) :
            user?.role === 'tutor' ? booking.tutorId ===Number(user.id) :
            true
          )
          .map((booking: Booking) => ({
            title: booking.subject,
            start: new Date(`${booking.date}T${booking.time}:00`),
            end: new Date(`${booking.date}T${booking.time}:00`),
            resource: booking
          }))
        
        setCalendarEvents(events)
        
        // Calculate stats based on user role
        if (user?.role === 'student') {
          const userBookings = allBookings.filter((b: Booking) => b.studentId === Number(user.id))
          const tutorBookings = userBookings.filter((b: Booking) => b.type === 'tutor')
          const courseBookings = userBookings.filter((b: Booking) => b.type === 'course')
          
          setStats({
            totalCourses: courseBookings.length,
            enrolledCourses: courseBookings.filter((b: Booking) => b.status === 'confirmed').length,
            completedCourses: tutorBookings.filter((b: Booking) => new Date(b.date) < new Date()).length,
            upcomingLessons: userBookings.filter((b: Booking) => new Date(b.date) > new Date()).length,
            totalSpent: userBookings.reduce((sum: number, b: Booking) => sum + b.price, 0),
            certificates: 2
          })
        } else if (user?.role === 'tutor') {
          const tutorBookings = allBookings.filter((b: Booking) => b.tutorId === Number(user.id))
          const completedLessons = tutorBookings.filter((b: Booking) => new Date(b.date) < new Date())
          const upcomingLessons = tutorBookings.filter((b: Booking) => new Date(b.date) > new Date())
          
          setStats({
            totalCourses: tutorBookings.length,
            enrolledCourses: new Set(tutorBookings.map((b: Booking) => b.studentId)).size,
            completedCourses: completedLessons.length,
            upcomingLessons: upcomingLessons.length,
            totalSpent: tutorBookings.reduce((sum: number, b: Booking) => sum + b.price, 0),
            certificates: 0
          })
        } else {
          // Admin stats
          setStats({
            totalCourses: 12,
            enrolledCourses: 3,
            completedCourses: 2,
            upcomingLessons: 8,
            totalSpent: 2847,
            certificates: 2
          })
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadDashboardData()
  }, [user])

  const recentActivities = [
    {
      type: 'course_completed',
      title: 'Deutsch A1 Grundkurs abgeschlossen',
      date: '2025-01-15',
      icon: Award,
      color: 'text-green-600'
    },
    {
      type: 'lesson_scheduled',
      title: 'Nächste Lektion: Business Deutsch',
      date: '2025-01-22',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      type: 'visa_service',
      title: 'Visa-Beratung Termin gebucht',
      date: '2025-01-18',
      icon: FileText,
      color: 'text-purple-600'
    }
  ]

  const enrolledCourses = [
    {
      id: 1,
      title: 'Business Deutsch B2',
      school: 'Goethe Institut Rabat',
      progress: 65,
      nextLesson: '2025-01-22',
      level: 'B2'
    },
    {
      id: 2,
      title: 'Deutsch für Mediziner C1',
      school: 'Deutsche Sprachakademie',
      progress: 30,
      nextLesson: '2025-01-20',
      level: 'C1'
    },
    {
      id: 3,
      title: 'Konversationskurs B1',
      school: 'Atlas Sprachzentrum',
      progress: 80,
      nextLesson: '2025-01-19',
      level: 'B1'
    }
  ]

  const upcomingLessons = [
    {
      id: 1,
      course: 'Business Deutsch B2',
      date: '2025-01-22',
      time: '18:00 - 20:00',
      type: 'Präsenz',
      location: 'Goethe Institut Rabat'
    },
    {
      id: 2,
      course: 'Konversationskurs B1',
      date: '2025-01-19',
      time: '16:00 - 17:30',
      type: 'Online',
      location: 'Zoom Meeting'
    }
  ]

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Aktive Nutzer</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">89</div>
                  <div className="text-sm text-gray-600">Aktive Kurse</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Euro className="w-8 h-8 text-blue-700" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">€52,340</div>
                  <div className="text-sm text-gray-600">Umsatz (Monat)</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">+23%</div>
                  <div className="text-sm text-gray-600">Wachstum</div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'tutor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">45</div>
                  <div className="text-sm text-gray-600">Meine Studenten</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <div className="text-sm text-gray-600">Aktive Kurse</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-700" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">124</div>
                  <div className="text-sm text-gray-600">Unterrichtsstunden</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">4.8</div>
                  <div className="text-sm text-gray-600">Bewertung</div>
                </div>
              </div>
            </div>
          </div>
        )
      default: // student
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.enrolledCourses}</div>
                  <div className="text-sm text-gray-600">Aktive Kurse</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.certificates}</div>
                  <div className="text-sm text-gray-600">Zertifikate</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-700" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.upcomingLessons}</div>
                  <div className="text-sm text-gray-600">Kommende Lektionen</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Euro className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">€{stats.totalSpent}</div>
                  <div className="text-sm text-gray-600">Investiert</div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const renderBookings = () => {
    const userBookings = bookings.filter((b: Booking) => 
      user?.role === 'student' ? b.studentId === Number(user.id) : 
      user?.role === 'tutor' ? b.tutorId === Number(user.id) : 
      true
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Meine Buchungen</h2>
          <div className="flex gap-2">
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              onChange={(e) => {
                const filtered = bookings.filter((b: Booking) => 
                  e.target.value === 'all' ? true : b.status === e.target.value
                )
                setBookings(filtered)
              }}
            >
              <option value="all">Alle Status</option>
              <option value="confirmed">Bestätigt</option>
              <option value="pending">Ausstehend</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum & Zeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zahlung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userBookings.map((booking: Booking) => {
                const bookingDate = new Date(`${booking.date}T${booking.time}`)
                const isPast = bookingDate < new Date()
                const tutor = tutors.find(t => t.id === booking.tutorId)

                return (
                  <tr key={booking.id} className={isPast ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(booking.date).toLocaleDateString('de-DE')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.time} Uhr
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.subject}</div>
                      <div className="text-sm text-gray-500">
                        {tutor ? `mit ${tutor.name}` : 'Schulkurs'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {booking.type === 'tutor' ? 'Einzelunterricht' : 'Kurs'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'confirmed' ? 'Bestätigt' :
                         booking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.paymentStatus === 'paid' ? 'Bezahlt' :
                         booking.paymentStatus === 'pending' ? 'Ausstehend' : 'Erstattet'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderCourses = () => {
    const sortedCourseBookings = courseBookings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Meine Kurse</h2>
          <div className="flex gap-2">
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              onChange={(e) => {
                // Filter course bookings by status
                if (e.target.value === 'all') {
                  // Reset to original data - would need to reload from API
                  return
                }
                // In a real implementation, you'd filter the data or reload from API
              }}
            >
              <option value="all">Alle Status</option>
              <option value="confirmed">Bestätigt</option>
              <option value="pending">Ausstehend</option>
              <option value="cancelled">Storniert</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </div>
        </div>

        {sortedCourseBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kursbuchungen</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sie haben noch keine Kurse gebucht. Entdecken Sie unsere Kursangebote!
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kurse durchsuchen
              </button>
            </div>
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
                      <Users className="w-4 h-4 mr-2" />
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
                          <Play className="w-3 h-3 mr-1" />
                          Join
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/courses/${courseBooking.course_id}`)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Details
                      </button>
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

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Willkommen zurück, {user?.name}!
              </h1>
              <p className="text-gray-600 capitalize">
                {user?.role === 'student' ? 'Student' : 
                 user?.role === 'tutor' ? 'Sprachlehrer' : 
                 user?.role === 'school' ? 'Sprachschule' : 'Administrator'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-400 ring-2 ring-white"></span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {getRoleSpecificContent()}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Übersicht', icon: TrendingUp },
                ...(user?.role === 'student' ? [
                  { id: 'bookings', label: 'Meine Termine', icon: Calendar },
                  { id: 'courses', label: 'Meine Kurse', icon: BookOpen },
                  { id: 'progress', label: 'Lernfortschritt', icon: Award }
                ] : []),
                ...(user?.role === 'tutor' ? [
                  { id: 'calendar', label: 'Kalender', icon: Calendar },
                  { id: 'students', label: 'Meine Schüler', icon: Users },
                  { id: 'earnings', label: 'Einnahmen', icon: Euro },
                  { id: 'availability', label: 'Verfügbarkeit', icon: Clock }
                ] : []),
                ...(user?.role === 'school' ? [
                  { id: 'courses', label: 'Meine Kurse', icon: BookOpen },
                  { id: 'students', label: 'Schüler', icon: Users },
                  { id: 'calendar', label: 'Kalender', icon: Calendar },
                  { id: 'revenue', label: 'Einnahmen', icon: Euro },
                  { id: 'settings', label: 'Einstellungen', icon: Settings }
                ] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
              <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Lessons */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Kommende Termine</h2>
                      <div className="space-y-4">
                        {upcomingLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 rounded-full p-2">
                            <Calendar className="w-6 h-6 text-blue-700" />
                          </div>
                            <div>
                              <div className="font-medium text-gray-900">{lesson.course}</div>
                            <div className="text-sm text-gray-500">
                              {lesson.date} • {lesson.time}
                              </div>
                              </div>
                            </div>
                        <div className="text-sm">
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {lesson.type}
                                </span>
                              </div>
                            </div>
                    ))}
                          </div>
                  </div>

                {/* Calendar */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Kalender</h2>
                    <BigCalendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                    style={{ height: 400 }}
                    defaultView="month"
                    views={['month', 'week', 'day']}
                      messages={{
                      next: "Weiter",
                      previous: "Zurück",
                      today: "Heute",
                      month: "Monat",
                      week: "Woche",
                      day: "Tag"
                    }}
                    />
                  </div>
                </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h2>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const Icon = activity.icon
                        return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`mt-1 ${activity.color}`}>
                            <Icon className="w-5 h-5" />
                              </div>
                              <div>
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.date}</p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Fortschritt</h2>
                    <div className="space-y-4">
                    {enrolledCourses.map(course => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">{course.title}</span>
                          <span className="text-sm text-gray-500">{course.progress}%</span>
                          </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${course.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              </div>
            )}

          {activeTab === 'bookings' && renderBookings()}
          
          {activeTab === 'courses' && user?.role === 'student' && renderCourses()}
          
          {/* Other tab content */}
        </div>
      </div>
    </div>
  )
}
