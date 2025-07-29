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
import { VideoCallModal } from '../components/VideoCallModal'
import { useNavigate } from 'react-router-dom';

moment.locale('de')
const localizer = momentLocalizer(moment)

// Update Booking interface to include payment_status
interface Booking {
  id: number
  studentName: string
  studentEmail: string
  date: string // YYYY-MM-DD for calculations
  displayDate: string // localized for UI
  time: string
  duration: number
  subject: string
  type: '1-zu-1' | 'Kleingruppe'
  status: 'bestätigt' | 'ausstehend' | 'abgeschlossen' | 'storniert'
  price: number
  notes?: string
  payment_status?: 'paid' | 'pending' | 'failed' | 'refunded' | null;
  meeting_link?: string;
  booking_type?: 'tutor' | 'course' | 'visa';
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
  weeklyEarnings: number
  totalLessons: number
  monthlyLessons: number
  weeklyLessons: number
  completedLessons: number
  scheduledLessons: number
  completedHours: number
  averageEarningsPerLesson: number
  averageEarningsPerHour: number
  earningsGrowth: number
  responseRate: number
  completionRate: number
  averageRating: number
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
  // Additional fields needed for editing
  duration_weeks?: number
  hours_per_week?: number
  start_date?: string
  end_date?: string
  is_online?: boolean
  level?: string
  category?: string
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
    weeklyEarnings: 580,
    totalLessons: 124,
    monthlyLessons: 18,
    weeklyLessons: 4,
    completedLessons: 98,
    scheduledLessons: 26,
    completedHours: 98,
    averageEarningsPerLesson: 126.5,
    averageEarningsPerHour: 160,
    earningsGrowth: 12.5,
    responseRate: 95,
    completionRate: 85,
    averageRating: 4.8
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
    is_online: true,
    is_active: true // default to active
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add validation state
  const [formError, setFormError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isVerified, setIsVerified] = useState(false); // Assume true by default
  const [notifications, setNotifications] = useState<import('../lib/api').Notification[]>([])
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Add state for completed bookings and selected booking
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [coursesWithBookings, setCoursesWithBookings] = useState<Set<number>>(new Set())
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [hasUploadedDocuments, setHasUploadedDocuments] = useState(false)

  const handleCourseInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleStartVideoCall = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowVideoCall(true);
  };

  const handleCloseVideoCall = () => {
    setShowVideoCall(false);
    setSelectedBooking(null);
  };

  // Handle edit button click
  const handleEditCourse = (course: CourseOffering) => {
    setEditingCourse(course);
    
    // Helper function to format date for HTML input type="date"
    const formatDateForInput = (dateString: string | undefined): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
      } catch {
        return '';
      }
    };
    
    // Populate form with existing course data
    setNewCourse({
      title: course.title,
      description: course.description,
      level: (course.level || course.examType || 'A1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      category: course.category || (course.type === 'Prüfungsvorbereitung' ? 'exam_prep' : 'general'),
      price: course.price,
      duration_weeks: course.duration_weeks || Math.ceil(course.duration / 60),
      hours_per_week: course.hours_per_week || Math.ceil(course.duration / 60),
      max_students: course.maxStudents,
      start_date: formatDateForInput(course.start_date),
      end_date: formatDateForInput(course.end_date),
      is_online: course.is_online !== undefined ? course.is_online : true,
      is_active: course.isActive
    });
    setShowCourseModal(true);
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
      if (editingCourse) {
        // Update existing course
        const response = await coursesApi.updateTutorCourse(editingCourse.id, newCourse);
        toast({ title: 'Kurs erfolgreich aktualisiert', variant: 'default' });
        setShowCourseModal(false);
        setEditingCourse(null);
        setNewCourse({
          title: '', description: '', level: 'A1', category: 'general', price: 0,
          duration_weeks: 1, hours_per_week: 1, max_students: 1, start_date: '', end_date: '', is_online: true, is_active: true
        });
        // Update the course in the local state
        setCourseOfferings(prev => prev.map(course => 
          course.id === editingCourse.id 
            ? {
                ...course,
                title: response.course.title,
                description: response.course.description || '',
                type: response.course.category === 'exam_prep' ? 'Prüfungsvorbereitung' : 'Kleingruppe',
                duration: (response.course.duration_weeks || 1) * 60, // Convert weeks to minutes
                price: response.course.price,
                maxStudents: response.course.max_students || 1,
                examType: response.course.level,
                isActive: response.course.is_active || true
              }
            : course
        ));
      } else {
        // Create new course
        await coursesApi.createTutorCourse(newCourse);
        toast({ title: 'Kurs erfolgreich erstellt', variant: 'default' });
        setShowCourseModal(false);
        setNewCourse({
          title: '', description: '', level: 'A1', category: 'general', price: 0,
          duration_weeks: 1, hours_per_week: 1, max_students: 1, start_date: '', end_date: '', is_online: true, is_active: true
        });
        loadData();
      }
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
      setIsVerified(!!tutor.is_verified);
      // Check if tutor has uploaded documents (photo and CV are required)
      const hasDocuments = !!(tutor.cv_file_path && tutor.profile_photo);
      setHasUploadedDocuments(hasDocuments);
      // Fetch reviews for this tutor
      const tutorDetails = await tutorsApi.getById(tutor.id);
      setReviews(tutorDetails.reviews || []);
      // Fetch bookings for this tutor
      const bookingsRes = await bookingsApi.getAll();
      
      // Status mapping function to convert English to German
      const mapStatusToGerman = (status: string): string => {
        switch (status) {
          case 'confirmed': return 'bestätigt';
          case 'pending': return 'ausstehend';
          case 'completed': return 'abgeschlossen';
          case 'cancelled': return 'storniert';
          default: return status;
        }
      };
      
      const bookingsData = (bookingsRes.bookings || []).map((b: any) => ({
        id: b.id,
        studentName: b.student_name || '',
        studentEmail: b.student_email || '',
        date: b.start_date || '', // keep as YYYY-MM-DD for calculations
        displayDate: b.start_date ? new Date(b.start_date).toLocaleDateString() : '', // for UI
        time: b.time_slot || '',
        duration: b.duration_minutes || 60,
        subject: b.subject || b.course_title || '',
        type: (b.booking_type === 'tutor' ? '1-zu-1' : 'Kleingruppe') as '1-zu-1' | 'Kleingruppe',
        status: mapStatusToGerman(b.status),
        price: b.booking_type === 'course' ? (Number(b.course_price) || 0) : (Number(b.total_price) || 0),
        notes: b.notes || '',
        payment_status: b.payment_status || null,
        booking_type: b.booking_type || 'tutor'
      })) as Booking[];
      
      setBookings(bookingsData);

      // Enhanced earnings calculations
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentWeek = getWeekNumber(now);
      
      // Filter paid bookings
      const paidBookings = bookingsData.filter(b => b.payment_status === 'paid');
      const confirmedBookings = bookingsData.filter(b => b.status === 'bestätigt');
      const completedBookings = bookingsData.filter(b => b.status === 'abgeschlossen');
      
      // Calculate total earnings from paid bookings
      const totalEarnings = paidBookings.reduce((sum, b) => {
        const price = Number(b.price) || 0;
        return sum + price;
      }, 0);
      
      // Calculate monthly earnings (current month)
      const monthlyEarnings = paidBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).reduce((sum, b) => {
        const price = Number(b.price) || 0;
        return sum + price;
      }, 0);
      
      // Calculate weekly earnings (current week)
      const weeklyEarnings = paidBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
      }).reduce((sum, b) => sum + (b.price || 0), 0);
      
      // Calculate total hours (sum of duration in minutes / 60)
      const totalHours = paidBookings.reduce((sum, b) => sum + (b.duration || 0), 0) / 60;
      const completedHours = completedBookings.reduce((sum, b) => sum + (b.duration || 0), 0) / 60;
      
      // Calculate lesson counts
      const totalLessons = paidBookings.length;
      const completedLessons = completedBookings.length;
      const scheduledLessons = confirmedBookings.length;
      
      // Calculate monthly lessons (count of paid bookings in current month)
      const monthlyLessons = paidBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      // Calculate weekly lessons (count of paid bookings in current week)
      const weeklyLessons = paidBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
      }).length;
      
      // Calculate average earnings per lesson
      const averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
      const averageEarningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
      
      // Calculate earnings growth (compare with previous month)
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const previousMonthEarnings = paidBookings.filter(b => {
        if (!b.date) return false;
        const d = new Date(b.date);
        return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
      }).reduce((sum, b) => sum + (b.price || 0), 0);
      
      const earningsGrowth = previousMonthEarnings > 0 
        ? ((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) * 100 
        : 0;
      
      // Calculate response rate (percentage of confirmed bookings)
      const responseRate = bookingsData.length > 0 
        ? (confirmedBookings.length / bookingsData.length) * 100 
        : 0;
      
      // Calculate completion rate (percentage of completed bookings)
      const completionRate = confirmedBookings.length > 0 
        ? (completedLessons / confirmedBookings.length) * 100 
        : 0;

      setStats({
        totalEarnings,
        monthlyEarnings,
        weeklyEarnings,
        totalLessons: totalHours,
        monthlyLessons,
        weeklyLessons,
        completedLessons,
        scheduledLessons,
        completedHours,
        averageEarningsPerLesson,
        averageEarningsPerHour,
        earningsGrowth,
        responseRate,
        completionRate,
        averageRating: tutor.rating || 0
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
          isActive: course.is_active !== undefined ? course.is_active : true,
          // Additional fields for editing
          duration_weeks: course.duration_weeks || 1,
          hours_per_week: course.hours_per_week || 1,
          start_date: course.start_date || '',
          end_date: course.end_date || '',
          is_online: course.is_online !== undefined ? course.is_online : true,
          level: course.level || 'A1',
          category: course.category || 'general'
        }))
      );
      setCalendarEvents([]);

      // Check which courses have active bookings
      const coursesWithActiveBookings = new Set<number>();
      for (const course of coursesResponse.courses || []) {
        try {
          const bookingCheck = await coursesApi.checkCourseBookings(course.id);
          if (bookingCheck.hasActiveBookings) {
            coursesWithActiveBookings.add(course.id);
          }
        } catch (error) {
          // Error checking bookings for course
        }
      }
      setCoursesWithBookings(coursesWithActiveBookings);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Tutor-Daten',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      })
    }
  }

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

  // Helper function to check if a session is in the future
  const isSessionInFuture = (booking: Booking): boolean => {
    // Validate that we have both date and time
    if (!booking.date || !booking.time) {
      return false
    }

    try {
      const now = new Date()
      // Extract only the date part from booking.date (which is an ISO string)
      const datePart = booking.date.split('T')[0]; // e.g., 'YYYY-MM-DD'
      const sessionDateTimeString = `${datePart}T${booking.time}`; // e.g., 'YYYY-MM-DDTHH:MM'
      const sessionDate = new Date(sessionDateTimeString);
      
      // Check if the date is valid
      if (isNaN(sessionDate.getTime())) {
        return false
      }

      return sessionDate > now
    } catch (error) {
      return false
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      
      {/* Enhanced Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Euro className="text-emerald-600" size={24} />
            <span className="text-xs text-emerald-600 font-semibold">TOTAL</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{stats.totalEarnings.toLocaleString()} MAD</div>
          <div className="text-sm text-emerald-600">Gesamteinnahmen</div>
          <div className="text-xs text-emerald-500 mt-1">Ø {stats.averageEarningsPerLesson.toFixed(0)} MAD/Lektion</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <span className="text-xs text-blue-600 font-semibold">MONAT</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{stats.monthlyEarnings.toLocaleString()} MAD</div>
          <div className="text-sm text-blue-600">Diesen Monat</div>
          <div className={`text-xs mt-1 ${stats.earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.earningsGrowth >= 0 ? '+' : ''}{stats.earningsGrowth.toFixed(1)}% vs. Vormonat
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="text-purple-600" size={24} />
            <span className="text-xs text-purple-600 font-semibold">UNTERRICHT</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">{stats.completedHours.toFixed(1)}h</div>
          <div className="text-sm text-purple-600">Abgeschlossen</div>
          <div className="text-xs text-purple-500 mt-1">{stats.completedLessons} Lektionen</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Star className="text-yellow-600" size={24} />
            <span className="text-xs text-yellow-600 font-semibold">RATING</span>
          </div>
          <div className="text-2xl font-bold text-yellow-800">{stats.averageRating}/5</div>
          <div className="text-sm text-yellow-600">Durchschnittsbewertung</div>
          <div className="text-xs text-yellow-500 mt-1">{stats.completionRate.toFixed(0)}% Abschlussrate</div>
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Nächste Unterrichtsstunden</h3>
          <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Alle anzeigen →
          </button>
        </div>
        <div className="space-y-4">
          {(() => {
            const filteredBookings = bookings.filter(b => b.status === 'bestätigt' && b.booking_type === 'tutor' && isSessionInFuture(b));
            return filteredBookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="text-emerald-600" size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{booking.subject}</div>
                    <div className="text-sm text-gray-600">{booking.studentName}</div>
                    <div className="text-xs text-gray-500">{booking.studentEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">{booking.price} MAD</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarClock className="w-4 h-4 mr-2" />
                  <span>{booking.displayDate} um {booking.time}</span>
                  <span className="mx-2">•</span>
                  <span>{booking.duration} Minuten</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleStartVideoCall(booking)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Video-Call
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                    Chat
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Session starten
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    Verschieben
                  </button>
                  <button className="text-xs text-red-500 hover:text-red-700">
                    Stornieren
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {booking.notes && `Notizen: ${booking.notes}`}
                </div>
              </div>
            </div>
          ));
          })()}
          
          {bookings.filter(b => b.status === 'bestätigt' && b.booking_type === 'tutor' && isSessionInFuture(b)).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div className="font-medium">Keine anstehenden Sitzungen</div>
              <div className="text-sm">Neue Buchungen werden hier angezeigt</div>
            </div>
          )}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bezahlung</th>
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
                      <div className="text-sm font-medium text-gray-900">{booking.displayDate}</div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {booking.payment_status === 'paid' ? 'Bezahlt' : 'Unbezahlt'}
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
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                  {coursesWithBookings.has(course.id) && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Aktive Buchungen
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleEditCourse(course)
                  }}
                  className="text-blue-600 hover:text-blue-900"
                  title="Kurs bearbeiten"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={`${
                    coursesWithBookings.has(course.id) 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-900'
                  }`}
                  onClick={async () => {
                    if (coursesWithBookings.has(course.id)) {
                      toast({ 
                        title: 'Kurs kann nicht gelöscht werden', 
                        description: 'Es existieren aktive Buchungen für diesen Kurs.', 
                        variant: 'destructive' 
                      });
                      return;
                    }
                    if (!window.confirm('Möchten Sie diesen Kurs wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
                    try {
                      await coursesApi.deleteTutorCourse(course.id);
                      // Remove the course from local state immediately
                      setCourseOfferings(prev => 
                        prev.filter(c => c.id !== course.id)
                      );
                      toast({ title: 'Kurs erfolgreich gelöscht', variant: 'default' });
                    } catch (error: any) {
                      toast({ title: 'Fehler beim Löschen des Kurses', description: error.message, variant: 'destructive' });
                    }
                  }}
                  title={coursesWithBookings.has(course.id) ? 'Kurs kann nicht gelöscht werden - aktive Buchungen vorhanden' : 'Kurs löschen'}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    // Check if trying to deactivate a course with active bookings
                    if (course.isActive && coursesWithBookings.has(course.id)) {
                      toast({ 
                        title: 'Kurs kann nicht deaktiviert werden', 
                        description: 'Es existieren aktive Buchungen für diesen Kurs.', 
                        variant: 'destructive' 
                      });
                      return;
                    }
                    try {
                      await coursesApi.toggleActiveStatus(course.id, !course.isActive);
                      // Update the local state immediately
                      setCourseOfferings(prev => 
                        prev.map(c => 
                          c.id === course.id 
                            ? { ...c, isActive: !c.isActive }
                            : c
                        )
                      );
                      toast({ 
                        title: `Kurs ${!course.isActive ? 'aktiviert' : 'deaktiviert'}`, 
                        variant: 'default' 
                      });
                    } catch (error: any) {
                      toast({ 
                        title: 'Fehler beim Ändern des Kursstatus', 
                        description: error.message, 
                        variant: 'destructive' 
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    course.isActive 
                      ? coursesWithBookings.has(course.id)
                        ? 'bg-green-100 text-green-800 cursor-not-allowed opacity-75'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  title={coursesWithBookings.has(course.id) && course.isActive ? 'Kurs kann nicht deaktiviert werden - aktive Buchungen vorhanden' : ''}
                >
                  {course.isActive ? 'Aktiv' : 'Inaktiv'}
                </button>
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
            <h2 className="text-2xl font-bold mb-4">
              {editingCourse ? 'Edit course offering' : 'Create a new course offering'}
            </h2>
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
              <div className="flex items-center gap-2">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={newCourse.is_active}
                  onChange={e => setNewCourse(prev => ({ ...prev, is_active: e.target.checked }))}
                  id="is_active"
                />
                <label htmlFor="is_active">Active</label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition flex items-center justify-center">
                {isSubmitting && <span className="loader mr-2" style={{ borderTopColor: 'white', borderWidth: 2, width: 16, height: 16, borderRadius: '50%', borderStyle: 'solid', borderColor: 'white transparent transparent transparent', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
                {editingCourse ? 'Update Course' : 'Create Course'}
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
          <div className="flex items-center space-x-4">
            {/* Profile Completion Section */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-emerald-200">
              <button
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                onClick={() => navigate('/tutor-profile-complete')}
              >
                {hasUploadedDocuments ? 'Edit Your Profile' : 'Complete Profile'}
              </button>
            </div>
            
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-full hover:bg-emerald-100 focus:outline-none"
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

        {/* Video Call Modal */}
        {selectedBooking && (
          <VideoCallModal
            isOpen={showVideoCall}
            onClose={handleCloseVideoCall}
            booking={selectedBooking}
          />
        )}
      </div>
    </div>
  )
}
