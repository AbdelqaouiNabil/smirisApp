import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/de'
import { BookOpen, Users, FileText, Calendar, TrendingUp, Award, Clock, Euro, Settings, Bell, Star, CheckCircle, XCircle, Play } from 'lucide-react'
import { bookingsApi, Tutor, tutorsApi } from '../lib/api'

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
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    upcomingLessons: 0,
    totalSpent: 0,
    certificates: 0
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [bookingsRes, tutorsRes] = await Promise.all([
                  bookingsApi.getAll(),
        tutorsApi.getAll()
        ])
        
        const jsonBookingsData = bookingsRes.bookings || []
        const tutorsData = tutorsRes.tutors || []
        
        // Lade localStorage-Buchungen
        const localBookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
        
        // Kombiniere JSON-Buchungen mit localStorage-Buchungen
        const allBookings = [...jsonBookingsData, ...localBookings]
        
        setBookings(allBookings)
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

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Willkommen zurück, {user.name}!
              </h1>
              <p className="text-gray-600 capitalize">
                {user.role === 'student' ? 'Student' : 
                 user.role === 'tutor' ? 'Sprachlehrer' : 
                 user.role === 'school' ? 'Sprachschule' : 'Administrator'}
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
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Übersicht', icon: TrendingUp },
                ...(user.role === 'student' ? [
                  { id: 'bookings', label: 'Meine Termine', icon: Calendar },
                  { id: 'courses', label: 'Meine Kurse', icon: BookOpen },
                  { id: 'progress', label: 'Lernfortschritt', icon: Award }
                ] : []),
                ...(user.role === 'tutor' ? [
                  { id: 'calendar', label: 'Kalender', icon: Calendar },
                  { id: 'students', label: 'Meine Schüler', icon: Users },
                  { id: 'earnings', label: 'Einnahmen', icon: Euro },
                  { id: 'availability', label: 'Verfügbarkeit', icon: Clock }
                ] : []),
                ...(user.role === 'school' ? [
                  { id: 'courses', label: 'Meine Kurse', icon: BookOpen },
                  { id: 'students', label: 'Schüler', icon: Users },
                  { id: 'calendar', label: 'Kalender', icon: Calendar },
                  { id: 'revenue', label: 'Einnahmen', icon: Euro },
                  { id: 'settings', label: 'Einstellungen', icon: Settings }
                ] : []),
                ...(user.role === 'admin' ? [
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                  { id: 'users', label: 'Benutzer', icon: Users },
                  { id: 'revenue', label: 'Umsatz', icon: Euro }
                ] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {user.role === 'student' && (
                  <>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Meine aktiven Kurse</h2>
                      <div className="space-y-4">
                        {enrolledCourses.map(course => (
                          <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-gray-900">{course.title}</h3>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {course.level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{course.school}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Fortschritt</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-700 h-2 rounded-full" 
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Nächste: {new Date(course.nextLesson).toLocaleDateString('de-DE')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Kommende Lektionen</h2>
                      <div className="space-y-3">
                        {upcomingLessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{lesson.course}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(lesson.date).toLocaleDateString('de-DE')} • {lesson.time}
                              </div>
                              <div className="text-xs text-gray-500">
                                {lesson.type} • {lesson.location}
                              </div>
                            </div>
                            <button className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                              Details
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'admin' && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System-Übersicht</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Neue Anmeldungen heute</h3>
                        <div className="text-2xl font-bold text-blue-600">23</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">Aktive Buchungen</h3>
                        <div className="text-2xl font-bold text-green-600">156</div>
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'school' && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Schul-Übersicht</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Aktive Kurse</h3>
                        <div className="text-2xl font-bold text-blue-700">8</div>
                        <div className="text-sm text-blue-700">2 neue diese Woche</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">Eingeschriebene Schüler</h3>
                        <div className="text-2xl font-bold text-green-600">124</div>
                        <div className="text-sm text-green-600">+8 diese Woche</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="font-medium text-yellow-900 mb-2">Freie Plätze</h3>
                        <div className="text-2xl font-bold text-yellow-600">23</div>
                        <div className="text-sm text-yellow-600">Verfügbare Plätze</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-medium text-purple-900 mb-2">Monatsumsatz</h3>
                        <div className="text-2xl font-bold text-purple-600">€12.450</div>
                        <div className="text-sm text-purple-600">+15% vs. letzter Monat</div>
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'tutor' && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Meine Kurse heute</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Business Deutsch B2</div>
                          <div className="text-sm text-gray-600">14:00 - 16:00 • 12 Teilnehmer</div>
                        </div>
                        <button className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                          Teilnehmer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student Bookings Tab */}
            {activeTab === 'bookings' && user.role === 'student' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Meine Termine</h2>
                  <div className="space-y-4">
                    {bookings
                      .filter(booking => booking.studentId === Number(user.id))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(booking => {
                        const tutor = tutors.find(t => t.id === booking.tutorId)
                        return (
                          <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {tutor && (
                                  <img
                                    src={tutor.photo}
                                    alt={tutor.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <h3 className="font-medium text-gray-900">{booking.subject}</h3>
                                  <p className="text-sm text-gray-600">
                                    {tutor ? `mit ${tutor.name}` : 'Schulkurs'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(booking.date).toLocaleDateString('de-DE')} um {booking.time} Uhr
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {booking.status === 'confirmed' ? 'Bestätigt' :
                                   booking.status === 'pending' ? 'Ausstehend' : 'Storniert'}
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1">{booking.price}€</p>
                                {booking.meetingLink && (
                                  <a
                                    href={booking.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 text-xs"
                                  >
                                    Meeting beitreten
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Calendar Tab */}
            {activeTab === 'calendar' && user.role === 'tutor' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Mein Kalender</h2>
                  <div style={{ height: '500px' }}>
                    <BigCalendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                      messages={{
                        next: 'Weiter',
                        previous: 'Zurück',
                        today: 'Heute',
                        month: 'Monat',
                        week: 'Woche',
                        day: 'Tag',
                        agenda: 'Agenda',
                        date: 'Datum',
                        time: 'Zeit',
                        event: 'Termin',
                        noEventsInRange: 'Keine Termine in diesem Zeitraum'
                      }}
                      eventPropGetter={(event) => ({
                        style: {
                          backgroundColor: '#DC2626',
                          borderRadius: '4px',
                          opacity: 0.8,
                          color: 'white',
                          border: '0px',
                          display: 'block'
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Students Tab */}
            {activeTab === 'students' && user.role === 'tutor' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Meine Schüler</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(bookings
                      .filter(booking => booking.tutorId === Number(user.id))
                      .map(booking => booking.studentId)))
                      .map(studentId => {
                        const studentBookings = bookings.filter(b => 
                          b.studentId === studentId && b.tutorId === Number(user.id)
                        )
                        const totalLessons = studentBookings.length
                        const completedLessons = studentBookings.filter(b => 
                          new Date(b.date) < new Date()
                        ).length
                        const totalSpent = studentBookings.reduce((sum, b) => sum + b.price, 0)
                        
                        return (
                          <div key={studentId} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">Schüler #{studentId}</h3>
                                <p className="text-sm text-gray-600">
                                  {totalLessons} Lektionen gebucht
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Abgeschlossen:</span>
                                <span className="font-medium">{completedLessons}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Gesamtumsatz:</span>
                                <span className="font-medium text-green-600">{totalSpent}€</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Letzter Termin:</span>
                                <span className="text-gray-600">
                                  {new Date(Math.max(...studentBookings.map(b => 
                                    new Date(b.date).getTime()
                                  ))).toLocaleDateString('de-DE')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Earnings Tab */}
            {activeTab === 'earnings' && user.role === 'tutor' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Einnahmen-Übersicht</h2>
                  
                  {/* Earnings Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Diesen Monat</p>
                          <p className="text-2xl font-bold text-green-900">
                            {bookings
                              .filter(b => 
                                b.tutorId === Number(user.id) && 
                                new Date(b.date).getMonth() === new Date().getMonth()
                              )
                              .reduce((sum, b) => sum + b.price, 0)
                            }€
                          </p>
                        </div>
                        <Euro className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Lektionen diesen Monat</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {bookings
                              .filter(b => 
                                b.tutorId === Number(user.id) && 
                                new Date(b.date).getMonth() === new Date().getMonth()
                              ).length
                            }
                          </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Durchschnitt/Stunde</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {Math.round(bookings
                              .filter(b => b.tutorId === Number(user.id))
                              .reduce((sum, b) => sum + b.price, 0) / 
                              bookings.filter(b => b.tutorId === Number(user.id)).length
                            ) || 0}€
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Earnings */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Einnahmen</h3>
                  <div className="space-y-3">
                    {bookings
                      .filter(booking => booking.tutorId === Number(user.id))
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map(booking => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{booking.subject}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.date).toLocaleDateString('de-DE')} um {booking.time} Uhr
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+{booking.price}€</p>
                            <p className="text-xs text-gray-500">{booking.duration} Min</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* School Course Management Tab */}
            {activeTab === 'courses' && user.role === 'school' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Kursverwaltung</h2>
                    <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm">
                      Neuen Kurs hinzufügen
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Aktive Kurse</h3>
                      {[
                        { name: 'Intensivkurs Deutsch A1', students: 15, maxStudents: 20, price: 899, startDate: '2025-07-01' },
                        { name: 'Business Deutsch B2', students: 12, maxStudents: 15, price: 1299, startDate: '2025-07-15' },
                        { name: 'Deutsch für Mediziner C1', students: 8, maxStudents: 12, price: 1599, startDate: '2025-08-01' }
                      ].map((course, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                            <span className="text-sm text-gray-500">{course.price}€</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              {course.students}/{course.maxStudents} Teilnehmer
                            </span>
                            <span className="text-sm text-gray-500">
                              Start: {new Date(course.startDate).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <div className="flex space-x-2 mt-3">
                            <button className="text-blue-700 hover:text-blue-800 text-sm">Bearbeiten</button>
                            <button className="text-green-600 hover:text-green-700 text-sm">Teilnehmer</button>
                            <button className="text-gray-600 hover:text-gray-700 text-sm">Details</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Kurs-Statistiken</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900">Auslastung</h4>
                          <div className="text-2xl font-bold text-green-600">74%</div>
                          <div className="text-sm text-green-600">35 von 47 Plätzen belegt</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900">Warteliste</h4>
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-blue-600">Personen auf der Warteliste</div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h4 className="font-medium text-yellow-900">Nächster Kursstart</h4>
                          <div className="text-lg font-bold text-yellow-600">01.07.2025</div>
                          <div className="text-sm text-yellow-600">Intensivkurs A1</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* School Student Management Tab */}
            {activeTab === 'students' && user.role === 'school' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Schülerverwaltung</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurs</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlung</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          { name: 'Ahmed El Mansouri', course: 'Intensivkurs A1', level: 'A1', status: 'Aktiv', payment: 'Bezahlt' },
                          { name: 'Fatima Benali', course: 'Business B2', level: 'B2', status: 'Aktiv', payment: 'Ausstehend' },
                          { name: 'Omar Khadiri', course: 'Mediziner C1', level: 'C1', status: 'Warteliste', payment: 'Anzahlung' }
                        ].map((student, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.course}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {student.level}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                student.status === 'Aktiv' ? 'bg-green-100 text-green-800' : 
                                student.status === 'Warteliste' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                student.payment === 'Bezahlt' ? 'bg-green-100 text-green-800' : 
                                student.payment === 'Ausstehend' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.payment}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-700 hover:text-blue-900 mr-3">Details</button>
                              <button className="text-green-600 hover:text-green-900">Kontakt</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* School Revenue Tab */}
            {activeTab === 'revenue' && user.role === 'school' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Einnahmen & CMI-Payment</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Monatliche Einnahmen</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-900 font-medium">Juni 2025</span>
                            <span className="text-2xl font-bold text-blue-700">€12.450</span>
                          </div>
                          <div className="text-sm text-blue-700 mt-1">+15% vs. Mai</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-green-900 font-medium">CMI-Zahlungen</span>
                            <span className="text-xl font-bold text-green-600">€9.890</span>
                          </div>
                          <div className="text-sm text-green-600 mt-1">79% der Gesamteinnahmen</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">CMI-Payment Integration</h3>
                      <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">CMI Status</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">Aktiv</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Merchant ID: SCH_GS_2025_001</p>
                            <p>Verarbeitete Zahlungen: 34</p>
                            <p>Erfolgsrate: 98.2%</p>
                          </div>
                        </div>
                        <button className="w-full bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md">
                          CMI-Einstellungen verwalten
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="font-medium text-gray-900 mb-4">Letzte Transaktionen</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kurs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Methode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            { date: '20.06.2025', student: 'Ahmed El Mansouri', course: 'Intensivkurs A1', amount: 899, method: 'CMI', status: 'Bezahlt' },
                            { date: '19.06.2025', student: 'Fatima Benali', course: 'Business B2', amount: 1299, method: 'CMI', status: 'Bezahlt' },
                            { date: '18.06.2025', student: 'Omar Khadiri', course: 'Mediziner C1', amount: 500, method: 'CMI', status: 'Anzahlung' }
                          ].map((transaction, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.student}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.course}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">€{transaction.amount}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {transaction.method}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  transaction.status === 'Bezahlt' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Availability Tab */}
            {activeTab === 'availability' && user.role === 'tutor' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Verfügbarkeit verwalten</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Wöchentliche Verfügbarkeit</h3>
                      <div className="space-y-4">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                          <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium capitalize">
                              {day === 'monday' ? 'Montag' :
                               day === 'tuesday' ? 'Dienstag' :
                               day === 'wednesday' ? 'Mittwoch' :
                               day === 'thursday' ? 'Donnerstag' :
                               day === 'friday' ? 'Freitag' :
                               day === 'saturday' ? 'Samstag' : 'Sonntag'}
                            </span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                defaultValue="09:00"
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span>bis</span>
                              <input
                                type="time"
                                defaultValue="17:00"
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="checkbox"
                                defaultChecked
                                className="ml-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors">
                        Verfügbarkeit speichern
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Heute verfügbar</h3>
                      <div className="space-y-2">
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                          <div key={time} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{time} - {String(parseInt(time) + 1).padStart(2, '0')}:00</span>
                            <span className="text-green-600 text-sm">Verfügbar</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Buchungsstatistiken</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p>Diese Woche: {bookings.filter(b => 
                            b.tutorId === Number(user.id) && 
                            new Date(b.date) >= new Date() &&
                            new Date(b.date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ).length} Buchungen</p>
                          <p>Buchungsrate: 65%</p>
                          <p>Beliebteste Zeit: 15:00-16:00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="font-medium text-blue-900">Neuen Kurs buchen</div>
                  <div className="text-sm text-blue-700">Durchstöbern Sie unser Kursangebot</div>
                </button>
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="font-medium text-blue-900">Visa-Beratung buchen</div>
                  <div className="text-sm text-blue-600">Professionelle Unterstützung</div>
                </button>
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="font-medium text-green-900">Support kontaktieren</div>
                  <div className="text-sm text-green-600">Wir helfen Ihnen gerne</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
