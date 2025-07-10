import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { 
  BookOpen, 
  Users, 
  Calendar as CalendarIcon, 
  Euro, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Clock, 
  Star,
  TrendingUp,
  FileText,
  Mail,
  Phone,
  Upload,
  Save,
  BarChart3,
  DollarSign,
  UserCheck,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Award,
  Bell,
  Filter,
  Search,
  Download,
  Share2,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreHorizontal,
  Globe,
  Camera,
  Link,
  Shield,
  Activity,
  ArrowUp,
  ArrowDown,
  Percent,
  Building,
  User
} from 'lucide-react'

// Interfaces
interface SchoolStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  monthlyBookings: number
  monthlyRevenue: number
  yearlyRevenue: number
  averageRating: number
  pendingRequests: number
  completedCourses: number
  conversionRate: number
  popularCourse: string
  recentBookings: number
  cancelledBookings: number
  refundRate: number
}

interface Course {
  id: number
  title: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  price: number
  duration: string
  maxStudents: number
  currentStudents: number
  status: 'active' | 'inactive' | 'full' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  schedule: string
  description: string
  category: 'General' | 'Business' | 'Academic' | 'Exam Prep' | 'Conversation'
  location: 'Online' | 'In-Person' | 'Hybrid'
  instructor: string
  materials: string[]
  requirements: string
  objectives: string[]
  image: string
  createdAt: string
  updatedAt: string
}

interface Booking {
  id: number
  courseId: number
  courseName: string
  studentName: string
  studentEmail: string
  studentPhone: string
  bookingDate: string
  startDate: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'refunded'
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded'
  amount: number
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer'
  notes: string
  cancellationReason?: string
}

interface Student {
  id: number
  name: string
  email: string
  phone: string
  level: string
  enrolledCourses: number[]
  joinDate: string
  totalPaid: number
  status: 'active' | 'inactive' | 'graduated'
  progress: number
  lastActivity: string
  avatar: string
  nationality: string
  age: number
  goals: string[]
}

interface Review {
  id: number
  courseId: number
  courseName: string
  studentName: string
  rating: number
  comment: string
  date: string
  status: 'published' | 'pending' | 'hidden'
  helpful: number
  response?: string
  responseDate?: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    type: 'course' | 'meeting' | 'event'
    courseId?: number
    status: string
    students: number
  }
}

interface SchoolInfo {
  id: number
  name: string
  address: string
  city: string
  phone: string
  email: string
  website: string
  description: string
  certifications: string[]
  images: string[]
  founded: string
  specializations: string[]
  facilities: string[]
  awards: string[]
  socialMedia: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }
  businessHours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  bankInfo: {
    accountName: string
    iban: string
    bank: string
  }
  taxInfo: {
    taxId: string
    registrationNumber: string
  }
}

const localizer = momentLocalizer(moment)

const EnhancedSchoolDashboard = () => {
  const { user, canManageSchool } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<SchoolStats>({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    monthlyBookings: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    averageRating: 0,
    pendingRequests: 0,
    completedCourses: 0,
    conversionRate: 0,
    popularCourse: '',
    recentBookings: 0,
    cancelledBookings: 0,
    refundRate: 0
  })
  
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    id: 0,
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    certifications: [],
    images: [],
    founded: '',
    specializations: [],
    facilities: [],
    awards: [],
    socialMedia: {},
    businessHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '09:00-14:00',
      sunday: 'Geschlossen'
    },
    bankInfo: {
      accountName: '',
      iban: '',
      bank: ''
    },
    taxInfo: {
      taxId: '',
      registrationNumber: ''
    }
  })
  
  const [showModal, setShowModal] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Simulated data loading
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Simulate API calls
      const mockStats: SchoolStats = {
        totalCourses: 24,
        activeCourses: 18,
        totalStudents: 156,
        monthlyBookings: 32,
        monthlyRevenue: 15750,
        yearlyRevenue: 189000,
        averageRating: 4.8,
        pendingRequests: 5,
        completedCourses: 45,
        conversionRate: 87.5,
        popularCourse: 'Business Deutsch B2',
        recentBookings: 8,
        cancelledBookings: 2,
        refundRate: 3.2
      }

      const mockCourses: Course[] = [
        {
          id: 1,
          title: 'Business Deutsch B2',
          level: 'B2',
          price: 899,
          duration: '8 Wochen',
          maxStudents: 15,
          currentStudents: 12,
          status: 'active',
          startDate: '2025-07-01',
          endDate: '2025-08-26',
          schedule: 'Mo-Fr 09:00-11:00',
          description: 'Professionelles Business Deutsch für den Arbeitsplatz',
          category: 'Business',
          location: 'Hybrid',
          instructor: 'Prof. Maria Schmidt',
          materials: ['Kursbuch', 'Arbeitsbuch', 'Online Portal'],
          requirements: 'B1 Zertifikat erforderlich',
          objectives: ['Geschäftskommunikation', 'Präsentationen', 'Verhandlungen'],
          image: '/images/course-business.jpg',
          createdAt: '2025-06-01',
          updatedAt: '2025-06-15'
        },
        {
          id: 2,
          title: 'Deutsch A1 Anfänger',
          level: 'A1',
          price: 599,
          duration: '6 Wochen',
          maxStudents: 20,
          currentStudents: 18,
          status: 'active',
          startDate: '2025-07-15',
          endDate: '2025-08-26',
          schedule: 'Mo-Mi-Fr 18:00-20:00',
          description: 'Perfekter Einstieg in die deutsche Sprache',
          category: 'General',
          location: 'In-Person',
          instructor: 'Thomas Müller',
          materials: ['Netzwerk A1', 'Audio-CDs', 'App-Zugang'],
          requirements: 'Keine Vorkenntnisse',
          objectives: ['Grundwortschatz', 'Erste Gespräche', 'Alphabet & Zahlen'],
          image: '/images/course-a1.jpg',
          createdAt: '2025-05-15',
          updatedAt: '2025-06-10'
        }
      ]

      const mockBookings: Booking[] = [
        {
          id: 1,
          courseId: 1,
          courseName: 'Business Deutsch B2',
          studentName: 'Ahmed Hassan',
          studentEmail: 'ahmed@email.com',
          studentPhone: '+212-6-12345678',
          bookingDate: '2025-06-20',
          startDate: '2025-07-01',
          status: 'confirmed',
          paymentStatus: 'paid',
          amount: 899,
          paymentMethod: 'stripe',
          notes: 'Möchte vor Kursbeginn ein Beratungsgespräch'
        },
        {
          id: 2,
          courseId: 2,
          courseName: 'Deutsch A1 Anfänger',
          studentName: 'Fatima Benali',
          studentEmail: 'fatima@email.com',
          studentPhone: '+212-6-87654321',
          bookingDate: '2025-06-21',
          startDate: '2025-07-15',
          status: 'pending',
          paymentStatus: 'pending',
          amount: 599,
          paymentMethod: 'paypal',
          notes: 'Wartet auf Zahlungsbestätigung'
        }
      ]

      setStats(mockStats)
      setCourses(mockCourses)
      setBookings(mockBookings)
      
      // Generate calendar events from courses
      const events: CalendarEvent[] = mockCourses.map(course => ({
        id: course.id,
        title: course.title,
        start: new Date(course.startDate),
        end: new Date(course.endDate),
        resource: {
          type: 'course',
          courseId: course.id,
          status: course.status,
          students: course.currentStudents
        }
      }))
      setCalendarEvents(events)

    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Dashboard-Daten konnten nicht geladen werden",
        variant: "destructive"
      })
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Aktive Kurse</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.activeCourses}</p>
              <p className="text-xs text-gray-500">von {stats.totalCourses} gesamt</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <BookOpen className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Studenten</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={12} />
                <p className="text-xs text-green-500 ml-1">+12% diesen Monat</p>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monatsumsatz</p>
              <p className="text-3xl font-bold text-green-600">{stats.monthlyRevenue.toLocaleString()} MAD</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={12} />
                <p className="text-xs text-green-500 ml-1">+18% vs. letzter Monat</p>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bewertung</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.averageRating}</p>
              <div className="flex items-center mt-1">
                <Star className="text-yellow-400 fill-current" size={12} />
                <p className="text-xs text-gray-500 ml-1">aus 127 Bewertungen</p>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2 text-emerald-600" size={20} />
            Buchungstrends
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Buchungsstatistik-Chart</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 text-blue-600" size={20} />
            Kursverteilung
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Business Deutsch</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Allgemein Deutsch</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
                <span className="text-sm font-medium">60%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Prüfungsvorbereitung</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="mr-2 text-slate-600" size={20} />
          Letzte Aktivitäten
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="text-green-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Neue Buchung erhalten</p>
              <p className="text-xs text-gray-500">Ahmed Hassan hat sich für Business Deutsch B2 angemeldet</p>
            </div>
            <span className="text-xs text-gray-400">vor 2 Std.</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Star className="text-blue-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Neue 5-Sterne Bewertung</p>
              <p className="text-xs text-gray-500">Fatima Benali hat Ihren A2 Kurs bewertet</p>
            </div>
            <span className="text-xs text-gray-400">vor 5 Std.</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertCircle className="text-yellow-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Kurs fast ausgebucht</p>
              <p className="text-xs text-gray-500">Deutsch A1 Anfänger hat nur noch 2 freie Plätze</p>
            </div>
            <span className="text-xs text-gray-400">vor 1 Tag</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCourseManagement = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kursmanagement</h2>
          <p className="text-gray-600">Verwalten Sie Ihre Deutschkurse</p>
        </div>
        <button 
          onClick={() => setShowModal('add-course')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Neuer Kurs</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Kurse suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
          <option value="full">Ausgebucht</option>
          <option value="completed">Abgeschlossen</option>
        </select>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="relative">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/course-default.jpg'
                }}
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  course.status === 'active' ? 'bg-green-100 text-green-800' :
                  course.status === 'full' ? 'bg-red-100 text-red-800' :
                  course.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {course.status}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-600 text-white px-2 py-1 text-xs font-medium rounded">
                  {course.level}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon size={16} className="mr-2" />
                  <span>{course.schedule}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  <span>{course.currentStudents}/{course.maxStudents} Teilnehmer</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Euro size={16} className="mr-2" />
                  <span className="font-semibold text-emerald-600">{course.price} MAD</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Verwalten
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buchungen</h2>
          <p className="text-gray-600">Übersicht aller Kursbuchungen</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download size={16} />
            <span>Exportieren</span>
          </button>
        </div>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Neue Buchungen</p>
              <p className="text-2xl font-bold text-green-600">{stats.recentBookings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bestätigt</p>
              <p className="text-2xl font-bold text-blue-600">{bookings.filter(b => b.status === 'confirmed').length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ausstehend</p>
              <p className="text-2xl font-bold text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storniert</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Aktuelle Buchungen</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.studentName}</div>
                      <div className="text-sm text-gray-500">{booking.studentEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.courseName}</div>
                    <div className="text-sm text-gray-500">Start: {booking.startDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.bookingDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.amount} MAD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-900">Ansehen</button>
                      <button className="text-blue-600 hover:text-blue-900">Bearbeiten</button>
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

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kalender</h2>
          <p className="text-gray-600">Kurszeiten und Termine verwalten</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: "Weiter",
              previous: "Zurück",
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag",
              agenda: "Agenda",
              date: "Datum",
              time: "Zeit",
              event: "Ereignis",
              noEventsInRange: "Keine Ereignisse in diesem Zeitraum."
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.resource?.type === 'course' ? '#059669' : '#3B82F6',
                borderColor: event.resource?.type === 'course' ? '#047857' : '#2563EB',
              }
            })}
          />
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Berichte</h2>
        <p className="text-gray-600">Detaillierte Einblicke in Ihre Schulperformance</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Konversionsrate</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={12} />
                <span className="text-xs text-green-500 ml-1">+5.2% vs. letzter Monat</span>
              </div>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <Target className="text-emerald-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Beliebtester Kurs</p>
              <p className="text-lg font-bold text-blue-600">{stats.popularCourse}</p>
              <p className="text-xs text-gray-500">32 Buchungen</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Award className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stornierungsrate</p>
              <p className="text-2xl font-bold text-orange-600">{stats.refundRate}%</p>
              <div className="flex items-center mt-1">
                <ArrowDown className="text-green-500" size={12} />
                <span className="text-xs text-green-500 ml-1">-1.1% vs. letzter Monat</span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Percent className="text-orange-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jahresumsatz</p>
              <p className="text-2xl font-bold text-purple-600">{stats.yearlyRevenue.toLocaleString()} MAD</p>
              <div className="flex items-center mt-1">
                <ArrowUp className="text-green-500" size={12} />
                <span className="text-xs text-green-500 ml-1">+24% vs. letztes Jahr</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Umsatzentwicklung</h3>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Revenue Chart Placeholder</p>
        </div>
      </div>

      {/* Course Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Kursperformance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Kurs</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Buchungen</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Umsatz</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Bewertung</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">Business Deutsch B2</td>
                <td className="py-3 px-4">32</td>
                <td className="py-3 px-4 font-medium text-green-600">28,768 MAD</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="ml-1">4.9</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center text-green-600">
                    <ArrowUp size={16} />
                    <span className="ml-1">+15%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">Deutsch A1 Anfänger</td>
                <td className="py-3 px-4">28</td>
                <td className="py-3 px-4 font-medium text-green-600">16,772 MAD</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="ml-1">4.7</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center text-green-600">
                    <ArrowUp size={16} />
                    <span className="ml-1">+8%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Einstellungen</h2>
        <p className="text-gray-600">Schulinformationen und Konfiguration verwalten</p>
      </div>

      {/* School Information */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Building size={20} className="mr-2 text-emerald-600" />
          Schulinformationen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schulname</label>
            <input
              type="text"
              value={schoolInfo.name}
              onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Name Ihrer Sprachschule"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={(e) => setSchoolInfo({...schoolInfo, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="kontakt@ihre-schule.ma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
            <input
              type="tel"
              value={schoolInfo.phone}
              onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+212-5-XX-XX-XX-XX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={schoolInfo.website}
              onChange={(e) => setSchoolInfo({...schoolInfo, website: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://ihre-schule.ma"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            <input
              type="text"
              value={schoolInfo.address}
              onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ihre vollständige Adresse"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
            <textarea
              value={schoolInfo.description}
              onChange={(e) => setSchoolInfo({...schoolInfo, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Beschreiben Sie Ihre Sprachschule..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
            <Save size={16} />
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign size={20} className="mr-2 text-green-600" />
          Zahlungseinstellungen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kontoinhaber</label>
            <input
              type="text"
              value={schoolInfo.bankInfo.accountName}
              onChange={(e) => setSchoolInfo({
                ...schoolInfo,
                bankInfo: {...schoolInfo.bankInfo, accountName: e.target.value}
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Name des Kontoinhabers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
            <input
              type="text"
              value={schoolInfo.bankInfo.iban}
              onChange={(e) => setSchoolInfo({
                ...schoolInfo,
                bankInfo: {...schoolInfo.bankInfo, iban: e.target.value}
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="MA XX XXXX XXXX XXXX XXXX XXXX XX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
            <input
              type="text"
              value={schoolInfo.bankInfo.bank}
              onChange={(e) => setSchoolInfo({
                ...schoolInfo,
                bankInfo: {...schoolInfo.bankInfo, bank: e.target.value}
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Name der Bank"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell size={20} className="mr-2 text-blue-600" />
          Benachrichtigungseinstellungen
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Neue Buchungen</h4>
              <p className="text-sm text-gray-500">Erhalten Sie sofortige Benachrichtigungen bei neuen Buchungen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Zahlungsbestätigungen</h4>
              <p className="text-sm text-gray-500">Benachrichtigung bei erfolgreichen Zahlungen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Neue Bewertungen</h4>
              <p className="text-sm text-gray-500">Benachrichtigung bei neuen Kursbewertungen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'courses':
        return renderCourseManagement()
      case 'bookings':
        return renderBookings()
      case 'students':
        return <div className="text-center py-20 text-gray-500">Studentenverwaltung wird implementiert...</div>
      case 'calendar':
        return renderCalendar()
      case 'reviews':
        return <div className="text-center py-20 text-gray-500">Bewertungsmanagement wird implementiert...</div>
      case 'analytics':
        return renderAnalytics()
      case 'settings':
        return renderSettings()
      default:
        return renderOverview()
    }
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: BarChart3 },
    { id: 'courses', label: 'Kurse', icon: BookOpen },
    { id: 'bookings', label: 'Buchungen', icon: CalendarIcon },
    { id: 'students', label: 'Studenten', icon: Users },
    { id: 'calendar', label: 'Kalender', icon: CalendarIcon },
    { id: 'reviews', label: 'Bewertungen', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Einstellungen', icon: Settings }
  ]

  if (!user || !canManageSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">Sie haben keine Berechtigung für das School Dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-2 rounded-lg">
                <Building className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">SmirisGermany School Dashboard</h1>
                <p className="text-sm text-gray-600">Verwalten Sie Ihre Sprachschule</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                  <Bell size={20} />
                  {stats.pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.pendingRequests}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">School Manager</p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="text-emerald-600" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.label}</span>
                      {tab.id === 'bookings' && stats.pendingRequests > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {stats.pendingRequests}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSchoolDashboard
