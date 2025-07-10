import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { 
  BookOpen, 
  Users, 
  Calendar, 
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
  Save
} from 'lucide-react'

interface SchoolStats {
  totalCourses: number
  totalStudents: number
  monthlyBookings: number
  monthlyRevenue: number
  averageRating: number
  pendingRequests: number
}

interface Course {
  id: number
  title: string
  level: string
  price: number
  duration: string
  maxStudents: number
  currentStudents: number
  status: 'active' | 'inactive' | 'full'
  startDate: string
  endDate: string
  schedule: string
  description: string
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
}

const SchoolDashboard = () => {
  const { user, canManageSchool } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<SchoolStats>({
    totalCourses: 0,
    totalStudents: 0,
    monthlyBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    pendingRequests: 0
  })
  
  const [courses, setCourses] = useState<Course[]>([])
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
    images: []
  })
  
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    level: 'A1',
    price: 0,
    duration: '',
    maxStudents: 20,
    schedule: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (!canManageSchool()) {
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung für das School-Dashboard",
        variant: "destructive"
      })
      return
    }
    loadSchoolData()
  }, [])

  const loadSchoolData = async () => {
    try {
      // Simuliere School-Daten basierend auf dem eingeloggten User
      const mockSchoolInfo: SchoolInfo = {
        id: 1,
        name: user?.role === 'school' ? user.name : 'Goethe Institut Casablanca',
        address: 'Rue de la Liberté 123, Casablanca',
        city: 'Casablanca',
        phone: '+212 522 123 456',
        email: user?.email || 'contact@goethe-casa.com',
        website: 'www.goethe-casa.com',
        description: 'Führende deutsche Sprachschule in Marokko mit über 20 Jahren Erfahrung.',
        certifications: ['Goethe Institut', 'CEFR zertifiziert', 'ISO 9001'],
        images: ['/images/school-casablanca.jpg']
      }
      setSchoolInfo(mockSchoolInfo)

      // Simuliere Kursdaten
      const mockCourses: Course[] = [
        {
          id: 1,
          title: 'Deutsch A1 Intensivkurs',
          level: 'A1',
          price: 2500,
          duration: '8 Wochen',
          maxStudents: 15,
          currentStudents: 12,
          status: 'active',
          startDate: '2025-07-01',
          endDate: '2025-08-26',
          schedule: 'Mo-Fr 9:00-11:00',
          description: 'Intensiver Deutschkurs für Anfänger'
        },
        {
          id: 2,
          title: 'Business Deutsch B2',
          level: 'B2',
          price: 3200,
          duration: '12 Wochen',
          maxStudents: 12,
          currentStudents: 8,
          status: 'active',
          startDate: '2025-06-15',
          endDate: '2025-09-07',
          schedule: 'Di/Do 18:00-20:00',
          description: 'Geschäftsdeutsch für Berufstätige'
        },
        {
          id: 3,
          title: 'Deutsch A2 Abendkurs',
          level: 'A2',
          price: 2800,
          duration: '10 Wochen',
          maxStudents: 18,
          currentStudents: 18,
          status: 'full',
          startDate: '2025-06-01',
          endDate: '2025-08-10',
          schedule: 'Mo/Mi/Fr 19:00-21:00',
          description: 'Deutscher Grundkurs für Berufstätige'
        }
      ]
      setCourses(mockCourses)

      // Simuliere Statistiken
      setStats({
        totalCourses: mockCourses.length,
        totalStudents: mockCourses.reduce((sum, course) => sum + course.currentStudents, 0),
        monthlyBookings: 45,
        monthlyRevenue: 125600,
        averageRating: 4.7,
        pendingRequests: 12
      })

    } catch (error) {
      console.error('Error loading school data:', error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der School-Daten",
        variant: "destructive"
      })
    }
  }

  const handleAddCourse = () => {
    if (!newCourse.title || !newCourse.price || !newCourse.startDate) {
      toast({
        title: "Fehlende Daten",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive"
      })
      return
    }

    const course: Course = {
      id: Date.now(),
      title: newCourse.title!,
      level: newCourse.level!,
      price: newCourse.price!,
      duration: newCourse.duration!,
      maxStudents: newCourse.maxStudents!,
      currentStudents: 0,
      status: 'active',
      startDate: newCourse.startDate!,
      endDate: newCourse.endDate!,
      schedule: newCourse.schedule!,
      description: newCourse.description!
    }

    setCourses([...courses, course])
    setShowAddCourseModal(false)
    setNewCourse({
      title: '',
      level: 'A1',
      price: 0,
      duration: '',
      maxStudents: 20,
      schedule: '',
      description: '',
      startDate: '',
      endDate: ''
    })

    toast({
      title: "Kurs hinzugefügt",
      description: `${course.title} wurde erfolgreich erstellt`,
    })
  }

  const handleDeleteCourse = (courseId: number) => {
    setCourses(courses.filter(course => course.id !== courseId))
    toast({
      title: "Kurs gelöscht",
      description: "Der Kurs wurde erfolgreich entfernt",
    })
  }

  const handleSaveSchoolInfo = () => {
    // Hier würde normalerweise ein API-Aufruf stattfinden
    setIsEditingInfo(false)
    toast({
      title: "Informationen gespeichert",
      description: "Ihre Schulinformationen wurden aktualisiert",
    })
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Aktive Kurse</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalCourses}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-blue-600 text-sm mt-2">+2 neue diesen Monat</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Gesamt Studenten</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-600 text-sm mt-2">+{stats.monthlyBookings} Buchungen diesen Monat</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Monatlicher Umsatz</p>
              <p className="text-3xl font-bold text-purple-900">{stats.monthlyRevenue.toLocaleString()} MAD</p>
            </div>
            <Euro className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-purple-600 text-sm mt-2">+15% vs. letzter Monat</p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Durchschnittsbewertung</p>
              <p className="text-3xl font-bold text-orange-900">{stats.averageRating}</p>
            </div>
            <Star className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-orange-600 text-sm mt-2">basierend auf 127 Bewertungen</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-gray-700">Neue Anmeldung für Business Deutsch B2</p>
            <span className="text-gray-500 text-sm">vor 1 Stunde</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">Kurs "Deutsch A1 Intensivkurs" ist zu 80% ausgebucht</p>
            <span className="text-gray-500 text-sm">vor 3 Stunden</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <p className="text-gray-700">Neue 5-Sterne Bewertung erhalten</p>
            <span className="text-gray-500 text-sm">vor 5 Stunden</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <p className="text-gray-700">Monatlicher Umsatzbericht verfügbar</p>
            <span className="text-gray-500 text-sm">vor 1 Tag</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCoursesTab = () => (
    <div className="space-y-6">
      {/* Courses Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Kursverwaltung</h2>
        <button
          onClick={() => setShowAddCourseModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Kurs
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  course.level === 'A1' || course.level === 'A2' ? 'bg-green-100 text-green-800' :
                  course.level === 'B1' || course.level === 'B2' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {course.level}
                </span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                course.status === 'active' ? 'bg-green-100 text-green-800' :
                course.status === 'full' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {course.status === 'active' ? 'Aktiv' :
                 course.status === 'full' ? 'Ausgebucht' : 'Inaktiv'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Euro className="w-4 h-4 mr-2" />
                <span>{course.price} MAD</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{course.currentStudents}/{course.maxStudents} Studenten</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{course.schedule}</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{course.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingCourse(course)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button className="text-gray-600 hover:text-gray-700">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Neuen Kurs hinzufügen</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kurstitel *</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Deutsch A1 Intensivkurs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sprachniveau *</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A1">A1 - Anfänger</option>
                    <option value="A2">A2 - Grundkenntnisse</option>
                    <option value="B1">B1 - Fortgeschritten</option>
                    <option value="B2">B2 - Selbständig</option>
                    <option value="C1">C1 - Kompetent</option>
                    <option value="C2">C2 - Muttersprachlich</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preis (MAD) *</label>
                  <input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({...newCourse, price: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dauer</label>
                  <input
                    type="text"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8 Wochen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max. Studenten</label>
                  <input
                    type="number"
                    value={newCourse.maxStudents}
                    onChange={(e) => setNewCourse({...newCourse, maxStudents: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zeitplan</label>
                  <input
                    type="text"
                    value={newCourse.schedule}
                    onChange={(e) => setNewCourse({...newCourse, schedule: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mo-Fr 9:00-11:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Startdatum *</label>
                  <input
                    type="date"
                    value={newCourse.startDate}
                    onChange={(e) => setNewCourse({...newCourse, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enddatum</label>
                  <input
                    type="date"
                    value={newCourse.endDate}
                    onChange={(e) => setNewCourse({...newCourse, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kursbeschreibung..."
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddCourse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kurs hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInfoTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Schulinformationen</h2>
        {!isEditingInfo ? (
          <button
            onClick={() => setIsEditingInfo(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditingInfo(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveSchoolInfo}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schulname</label>
            {isEditingInfo ? (
              <input
                type="text"
                value={schoolInfo.name}
                onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{schoolInfo.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stadt</label>
            {isEditingInfo ? (
              <input
                type="text"
                value={schoolInfo.city}
                onChange={(e) => setSchoolInfo({...schoolInfo, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                {schoolInfo.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
            {isEditingInfo ? (
              <input
                type="tel"
                value={schoolInfo.phone}
                onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                {schoolInfo.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
            {isEditingInfo ? (
              <input
                type="email"
                value={schoolInfo.email}
                onChange={(e) => setSchoolInfo({...schoolInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                {schoolInfo.email}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            {isEditingInfo ? (
              <input
                type="text"
                value={schoolInfo.address}
                onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{schoolInfo.address}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
            {isEditingInfo ? (
              <textarea
                value={schoolInfo.description}
                onChange={(e) => setSchoolInfo({...schoolInfo, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{schoolInfo.description}</p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Zertifizierungen</h3>
          <div className="flex flex-wrap gap-2">
            {schoolInfo.certifications.map((cert, index) => (
              <span key={index} className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (!canManageSchool()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <BookOpen className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">Sie haben keine Berechtigung für das School-Dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{schoolInfo.name}</h1>
          <p className="text-gray-600">School Dashboard - Verwalten Sie Ihre Kurse und Informationen</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Übersicht
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Kurse
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Schulinformationen
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'courses' && renderCoursesTab()}
            {activeTab === 'info' && renderInfoTab()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolDashboard
