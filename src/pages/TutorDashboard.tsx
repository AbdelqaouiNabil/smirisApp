import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/de'
import { useToast } from '../hooks/use-toast'
import { 
  Calendar as CalendarIcon, Users, Euro, Star, Clock, 
  MessageCircle, TrendingUp, BookOpen, Award, Settings,
  Plus, Edit, Trash2, CheckCircle, AlertCircle, Eye, CalendarClock, Bell
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tutorsApi, coursesApi, bookingsApi } from '../lib/api'
import React from 'react'
import { TutorAvailability } from '../components/TutorAvailability'
import { useNavigate } from 'react-router-dom';

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

// Add review type
interface Review {
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  reviewer_name: string;
}

// NotificationsPanel component
function NotificationsPanel({ notifications, onClose, onMarkAllRead }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-0 animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
          <span className="text-lg font-bold text-gray-900">Notifications</span>
          <div className="flex items-center gap-2">
            <button
              className="text-emerald-600 hover:underline text-sm"
              onClick={onMarkAllRead}
            >
              Mark all as read
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">×</button>
          </div>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">No notifications.</div>
          ) : notifications.map((n) => (
            <div
              key={n.id}
              className={`py-3 px-2 transition ${n.is_read ? 'opacity-60' : ''}`}
            >
              <div className="font-semibold text-gray-800 break-words">
                {n.subject}
              </div>
              <div className="text-gray-700 text-xs mb-1 break-words">
                {n.message}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  const { toast } = useToast()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate();
  
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

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isVerified, setIsVerified] = useState(true); // Assume true by default
  const [notifications, setNotifications] = useState<import('../lib/api').Notification[]>([])
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

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
    // Robust validation for all required fields and types
    if (!newCourse.title.trim()) {
      setFormError('Bitte geben Sie einen Kurstitel ein.');
      return;
    }
    if (!['A1','A2','B1','B2','C1','C2'].includes(newCourse.level)) {
      setFormError('Bitte wählen Sie ein gültiges Sprachniveau.');
      return;
    }
    if (!['general','business','exam_prep','conversation'].includes(newCourse.category)) {
      setFormError('Bitte wählen Sie eine gültige Kategorie.');
      return;
    }
    if (typeof newCourse.price !== 'number' || isNaN(newCourse.price) || newCourse.price < 0) {
      setFormError('Bitte geben Sie einen gültigen Preis ein.');
      return;
    }
    if (newCourse.duration_weeks && (typeof newCourse.duration_weeks !== 'number' || newCourse.duration_weeks < 1 || newCourse.duration_weeks > 52)) {
      setFormError('Die Kursdauer muss zwischen 1 und 52 Wochen liegen.');
      return;
    }
    if (newCourse.hours_per_week && (typeof newCourse.hours_per_week !== 'number' || newCourse.hours_per_week < 1 || newCourse.hours_per_week > 40)) {
      setFormError('Die Stunden pro Woche müssen zwischen 1 und 40 liegen.');
      return;
    }
    if (newCourse.max_students && (typeof newCourse.max_students !== 'number' || newCourse.max_students < 1 || newCourse.max_students > 100)) {
      setFormError('Die maximale Teilnehmerzahl muss zwischen 1 und 100 liegen.');
      return;
    }
    if (newCourse.start_date && isNaN(Date.parse(newCourse.start_date))) {
      setFormError('Bitte geben Sie ein gültiges Startdatum ein.');
      return;
    }
    if (newCourse.end_date && isNaN(Date.parse(newCourse.end_date))) {
      setFormError('Bitte geben Sie ein gültiges Enddatum ein.');
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
    if (!user) return;
    loadData();
    loadNotifications();
  }, [user]);

  const loadData = async () => {
    if (!user) return
    try {
      // Fetch real tutor data from backend
      const response = await tutorsApi.getByUserId(user.id)
      const tutor = response.tutor
      console.log('Tutor data:', tutor);
      console.log('is_verified value:', tutor.is_verified);
      console.log('is_verified type:', typeof tutor.is_verified);
      setIsVerified(!!tutor.is_verified);
      // Fetch reviews for this tutor
      const tutorDetails = await tutorsApi.getById(tutor.id);
      setReviews(tutorDetails.reviews || []);
      // Fetch bookings for this tutor
      const bookingsRes = await bookingsApi.getAll();
      const bookingsData = (bookingsRes.bookings || []).map((b: any) => ({
        id: b.id,
        studentName: b.student_name || '',
        studentEmail: b.student_email || '',
        date: b.start_date ? new Date(b.start_date).toLocaleDateString() : '',
        time: b.time_slot || '',
        duration: b.duration_minutes || 60,
        subject: b.subject || '',
        type: (b.booking_type === 'tutor' ? '1-zu-1' : 'Kleingruppe') as '1-zu-1' | 'Kleingruppe',
        status: b.status,
        price: b.total_price || 0,
        notes: b.notes || ''
      })) as Booking[];
      setBookings(bookingsData);
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
      setCalendarEvents([]);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Tutor-Daten',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      })
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await bookingsApi.markAllTutorNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      // Optionally show a toast
    }
  };

  const loadNotifications = async () => {
    try {
      // Fetch all notifications, not just unread
      const res = await bookingsApi.getTutorNotifications();
      setNotifications(res.notifications || []);
    } catch (error) {
      // Optionally show a toast
    }
  };

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
            className={`bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-xl hover:shadow-lg transition-all flex items-center ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isVerified}
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

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Letzte Bewertungen</h3>
        {reviews.length === 0 ? (
          <div className="text-gray-500">Noch keine Bewertungen vorhanden.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex items-center mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{review.reviewer_name}</span>
                  <span className="ml-2 text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.title && <div className="font-semibold text-gray-900 mb-1">{review.title}</div>}
                <div className="text-gray-700">{review.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profilstatus */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Profilstatus</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-700 mb-2">Ihr Profil ist noch nicht vollständig.</div>
            <button
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              onClick={() => navigate('/tutor-profile-complete')}
            >
              Profil vervollständigen
            </button>
          </div>
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
                      {booking.status !== 'abgeschlossen' && (
                        <button
                          className="text-emerald-600 hover:text-emerald-900"
                          onClick={async () => {
                            try {
                              await bookingsApi.updateStatus(booking.id, 'completed');
                              toast({ title: 'Buchung als abgeschlossen markiert', variant: 'default' });
                              loadData();
                            } catch (error: any) {
                              toast({ title: 'Fehler beim Abschließen der Buchung', description: error.message, variant: 'destructive' });
                            }
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      )}
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
      {!isVerified && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-4 flex items-center">
          <AlertCircle className="mr-2 text-yellow-600" size={24} />
          <div>
            <div className="font-semibold">Ihr Profil ist noch nicht verifiziert.</div>
            <div>Sie können erst Kurse erstellen und veröffentlichen, wenn Ihr Profil von einem Administrator überprüft und freigeschaltet wurde.</div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Meine Kursangebote</h2>
        <button
          onClick={() => setShowCourseModal(true)}
          className={`bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isVerified}
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
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={async () => {
                    if (!window.confirm('Möchten Sie diesen Kurs wirklich löschen?')) return;
                    try {
                      await coursesApi.deleteTutorCourse(course.id);
                      toast({ title: 'Kurs gelöscht', variant: 'default' });
                      loadData();
                    } catch (error: any) {
                      toast({ title: 'Fehler beim Löschen des Kurses', description: error.message, variant: 'destructive' });
                    }
                  }}
                >
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Bitte einloggen...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-8 px-4">
      {/* Global Unverified Banner */}
      {!isVerified && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-6 flex items-center">
          <AlertCircle className="mr-2 text-yellow-600" size={24} />
          <div>
            <div className="font-semibold">Ihr Profil ist noch nicht verifiziert.</div>
            <div>Sie können erst Kurse erstellen und veröffentlichen, wenn Ihr Profil von einem Administrator überprüft und freigeschaltet wurde.</div>
          </div>
        </div>
      )}
      {/* Notification Bell */}
      {/* Remove Notification Bell and Dropdown from the top right */}
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 inline-block">Tutor Dashboard</h1>
            <p className="text-gray-600">Welcome back! Manage your courses and bookings.</p>
          </div>
          <button
            className="relative p-2 rounded-full hover:bg-emerald-100 focus:outline-none ml-4"
            onClick={() => setShowNotificationsPanel(true)}
            aria-label="Show notifications"
          >
            <Bell className="text-emerald-600" size={28} />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
        </div>
        {showNotificationsPanel && (
          <NotificationsPanel
            notifications={notifications}
            onClose={() => setShowNotificationsPanel(false)}
            onMarkAllRead={markAllNotificationsAsRead}
          />
        )}

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
