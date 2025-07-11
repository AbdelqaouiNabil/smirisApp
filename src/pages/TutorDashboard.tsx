import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/de'
import { useToast } from '../hooks/use-toast'
import { 
  Calendar as CalendarIcon, Users, Euro, Star, Clock, 
  MessageCircle, TrendingUp, BookOpen, Award, Settings,
  Plus, Edit, Trash2, CheckCircle, AlertCircle, Eye, CalendarClock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tutorsApi, coursesApi } from '../lib/api'
import React from 'react'
import { TutorAvailability } from '../components/TutorAvailability'

moment.locale('de')
const localizer = momentLocalizer(moment)

interface Booking {
  id: number
  studentName: string
  studentEmail: string
  date: string
  time: string
  duration: number
  subject: string
  type: '1-zu-1' | 'Kleingruppe'
  status: 'bestätigt' | 'ausstehend' | 'abgeschlossen' | 'storniert'
  price: number
  notes?: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: Booking
}

interface TutorStats {
  totalEarnings: number
  monthlyEarnings: number
  totalLessons: number
  monthlyLessons: number
  averageRating: number
  responseRate: number
  nextLesson?: Booking
}

interface CourseOffering {
  id: number
  title: string
  description: string
  type: '1-zu-1' | 'Kleingruppe' | 'Prüfungsvorbereitung'
  duration: number
  price: number
  maxStudents: number
  examType?: string
  isActive: boolean
}

export default function TutorDashboard() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([])
  const [stats, setStats] = useState<TutorStats>({
    totalEarnings: 15680,
    monthlyEarnings: 2340,
    totalLessons: 124,
    monthlyLessons: 18,
    averageRating: 4.8,
    responseRate: 95
  })

  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseOffering | null>(null)

  // Course creation form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    level: 'A1',
    category: 'general',
    price: 0,
    duration_weeks: 1,
    hours_per_week: 1,
    max_students: 1,
    start_date: '',
    end_date: '',
    is_online: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add validation state
  const [formError, setFormError] = useState<string | null>(null);

  const handleCourseInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    // Simple validation
    if (!newCourse.title.trim() || !newCourse.level || !newCourse.category || !newCourse.price || !newCourse.max_students) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await coursesApi.createTutorCourse(newCourse);
      toast({ title: 'Kurs erfolgreich erstellt', variant: 'default' });
      setShowCourseModal(false);
      setNewCourse({
        title: '', description: '', level: 'A1', category: 'general', price: 0,
        duration_weeks: 1, hours_per_week: 1, max_students: 1, start_date: '', end_date: '', is_online: true
      });
      loadData();
    } catch (error) {
      setFormError(error.message || 'Fehler beim Erstellen des Kurses');
      toast({ title: 'Fehler beim Erstellen des Kurses', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'tutor') {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      // Fetch real tutor data from backend
      const response = await tutorsApi.getByUserId(user.id)
      const tutor = response.tutor
      // You may need to adjust the mapping below based on your backend response structure
      setStats({
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalLessons: tutor.total_hours || 0,
        monthlyLessons: 0,
        averageRating: tutor.rating || 0,
        responseRate: 0
      })
      // Fetch courses for this tutor
      const coursesResponse = await coursesApi.getAll({ tutor_id: tutor.id });
      setCourseOfferings(
        (coursesResponse.courses || []).map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          type: course.category === 'exam_prep' ? 'Prüfungsvorbereitung' : (course.max_students === 1 ? '1-zu-1' : 'Kleingruppe'),
          duration: course.hours_per_week ? course.hours_per_week * (course.duration_weeks || 1) * 60 : 60,
          price: course.price,
          maxStudents: course.max_students || 1,
          examType: course.level,
          isActive: true // or course.is_active if available
        }))
      );
      setBookings([]);
      setCalendarEvents([]);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Tutor-Daten',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bestätigt': return 'text-green-600 bg-green-100'
      case 'ausstehend': return 'text-yellow-600 bg-yellow-100'
      case 'abgeschlossen': return 'text-blue-600 bg-blue-100'
      case 'storniert': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Euro className="text-emerald-600" size={24} />
            <span className="text-xs text-emerald-600 font-semibold">TOTAL</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{stats.totalEarnings.toLocaleString()} MAD</div>
          <div className="text-sm text-emerald-600">Gesamteinnahmen</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <span className="text-xs text-blue-600 font-semibold">MONAT</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{stats.monthlyEarnings.toLocaleString()} MAD</div>
          <div className="text-sm text-blue-600">Diesen Monat</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="text-purple-600" size={24} />
            <span className="text-xs text-purple-600 font-semibold">UNTERRICHT</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">{stats.totalLessons}</div>
          <div className="text-sm text-purple-600">Stunden insgesamt</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Star className="text-yellow-600" size={24} />
            <span className="text-xs text-yellow-600 font-semibold">RATING</span>
          </div>
          <div className="text-2xl font-bold text-yellow-800">{stats.averageRating}/5</div>
          <div className="text-sm text-yellow-600">Durchschnittsbewertung</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Schnellaktionen</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowCourseModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-xl hover:shadow-lg transition-all flex items-center"
          >
            <Plus className="mr-3" size={20} />
            Neues Kursangebot
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:shadow-lg transition-all flex items-center"
          >
            <CalendarIcon className="mr-3" size={20} />
            Verfügbarkeit setzen
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl hover:shadow-lg transition-all flex items-center"
          >
            <Euro className="mr-3" size={20} />
            Einnahmen ansehen
          </button>
        </div>
      </div>

      {/* Upcoming Lessons */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Nächste Unterrichtsstunden</h3>
        <div className="space-y-4">
          {bookings.filter(b => b.status === 'bestätigt').slice(0, 3).map(booking => (
            <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="text-emerald-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{booking.subject}</div>
                  <div className="text-sm text-gray-600">{booking.studentName}</div>
                  <div className="text-xs text-gray-500">{booking.date} um {booking.time} ({booking.duration}min)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600">{booking.price} MAD</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Buchungen verwalten</h2>
        <div className="flex space-x-3">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>Alle Status</option>
            <option>Bestätigt</option>
            <option>Ausstehend</option>
            <option>Abgeschlossen</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Termin</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fach</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Typ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Preis</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{booking.studentName}</div>
                      <div className="text-sm text-gray-500">{booking.studentEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.date}</div>
                      <div className="text-sm text-gray-500">{booking.time} ({booking.duration}min)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.subject}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      {booking.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.price} MAD</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-900">
                        <Eye size={16} />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Meine Kursangebote</h2>
        <button
          onClick={() => setShowCourseModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center"
        >
          <Plus className="mr-2" size={20} />
          Neues Angebot
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseOfferings.map(course => (
          <div key={course.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingCourse(course)
                    setShowCourseModal(true)
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Typ:</span>
                <span className="font-medium">{course.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dauer:</span>
                <span className="font-medium">{course.duration} Min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max. Teilnehmer:</span>
                <span className="font-medium">{course.maxStudents}</span>
              </div>
              {course.examType && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prüfung:</span>
                  <span className="font-medium text-purple-600">{course.examType}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-emerald-600">{course.price} MAD</div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {course.isActive ? 'Aktiv' : 'Inaktiv'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Verfügbarkeitskalender</h2>
        <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center">
          <Plus className="mr-2" size={20} />
          Verfügbarkeit hinzufügen
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month', 'week', 'day']}
          messages={{
            next: 'Weiter',
            previous: 'Zurück',
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag'
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: '#059669',
              borderColor: '#047857',
              color: 'white'
            }
          })}
        />
      </div>
    </div>
  )

  const renderAvailability = () => (
    <div className="space-y-8">
      <TutorAvailability />
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: TrendingUp },
    { id: 'bookings', label: 'Buchungen', icon: CalendarIcon },
    { id: 'courses', label: 'Kursangebote', icon: BookOpen },
    { id: 'calendar', label: 'Kalender', icon: Clock },
    { id: 'availability', label: 'Verfügbarkeit', icon: CalendarClock },
    { id: 'earnings', label: 'Einnahmen', icon: Euro },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-8 px-4">
      {/* Course Creation Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button onClick={() => setShowCourseModal(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 font-bold">×</button>
            <h2 className="text-2xl font-bold mb-4">Create a new course offering</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input name="title" value={newCourse.title} onChange={handleCourseInput} required placeholder="Course title" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={newCourse.description} onChange={handleCourseInput} placeholder="Description" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Level *</label>
                  <select name="level" value={newCourse.level} onChange={handleCourseInput} className="w-full border rounded px-3 py-2">
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select name="category" value={newCourse.category} onChange={handleCourseInput} className="w-full border rounded px-3 py-2">
                    <option value="general">General</option>
                    <option value="business">Business</option>
                    <option value="exam_prep">Exam Preparation</option>
                    <option value="conversation">Conversation</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Price (MAD) *</label>
                  <input name="price" type="number" value={newCourse.price} onChange={handleCourseInput} required min={1} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Max. participants *</label>
                  <input name="max_students" type="number" value={newCourse.max_students} onChange={handleCourseInput} required min={1} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Duration (weeks)</label>
                  <input name="duration_weeks" type="number" value={newCourse.duration_weeks} onChange={handleCourseInput} min={1} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Hours per week</label>
                  <input name="hours_per_week" type="number" value={newCourse.hours_per_week} onChange={handleCourseInput} min={1} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Start date</label>
                  <input name="start_date" type="date" value={newCourse.start_date} onChange={handleCourseInput} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">End date</label>
                  <input name="end_date" type="date" value={newCourse.end_date} onChange={handleCourseInput} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input name="is_online" type="checkbox" checked={newCourse.is_online} onChange={e => setNewCourse(prev => ({ ...prev, is_online: e.target.checked }))} />
                <label htmlFor="is_online">Online Course</label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition flex items-center justify-center">
                {isSubmitting && <span className="loader mr-2" style={{ borderTopColor: 'white', borderWidth: 2, width: 16, height: 16, borderRadius: '50%', borderStyle: 'solid', borderColor: 'white transparent transparent transparent', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
                {isSubmitting ? 'Saving...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutor Dashboard</h1>
          <p className="text-gray-600">Willkommen zurück! Verwalten Sie Ihre Kurse und Buchungen.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-4 font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }
                `}
              >
                <tab.icon className="mr-2" size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Euro className="mx-auto mb-4 text-emerald-600" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Einnahmen-Dashboard</h3>
              <p className="text-gray-600">Detaillierte Einnahmenübersicht wird in der nächsten Version verfügbar sein.</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Settings className="mx-auto mb-4 text-emerald-600" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Einstellungen</h3>
              <p className="text-gray-600">Profil- und Kontoeinstellungen werden in der nächsten Version verfügbar sein.</p>
            </div>
          )}
          {activeTab === 'availability' && renderAvailability()}
        </div>

      </div>
    </div>
  )
}
