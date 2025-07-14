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
import { schoolsApi } from '../lib/api'
import { coursesApi } from '../lib/api'
import React from 'react'
import { API_BASE_URL } from '../lib/api';

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

  const [showEditCourseModal, setShowEditCourseModal] = useState(false)
  const [editCourseData, setEditCourseData] = useState<Partial<Course> | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([]);
  const [courseReviews, setCourseReviews] = useState<{ [courseId: number]: any[] }>({});

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

  useEffect(() => {
    if (courses.length === 0) return;
    const fetchAllReviews = async () => {
      const reviewsByCourse: { [courseId: number]: any[] } = {};
      await Promise.all(
        courses.map(async (course) => {
          try {
            const res = await fetch(`${API_BASE_URL}/reviews/course/${course.id}`);
            const data = await res.json();
            reviewsByCourse[course.id] = data.reviews || [];
          } catch (e) {
            reviewsByCourse[course.id] = [];
          }
        })
      );
      setCourseReviews(reviewsByCourse);
    };
    fetchAllReviews();
  }, [courses]);

  const loadSchoolData = async () => {
    try {
      // Fetch real school data for the logged-in user
      const response = await schoolsApi.getByUserId(user.id)
      const realSchool = response.school
      setSchoolInfo({
        id: realSchool.id,
        name: realSchool.name,
        address: realSchool.address || '',
        city: realSchool.location || '',
        phone: realSchool.phone || '',
        email: realSchool.email || '',
        website: realSchool.website || '',
        description: realSchool.description || '',
        certifications: realSchool.certifications || [],
        images: []
      })
      // Fetch reviews for this school
      const reviewsRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/schools/${realSchool.id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews || []);
      // Optionally, fetch courses for this school
      const coursesResponse = await coursesApi.getAll({ school_id: realSchool.id })
      setCourses((coursesResponse.courses || []).map(course => ({
        id: course.id,
        title: course.title,
        level: course.level,
        price: course.price,
        duration: course.duration_weeks ? `${course.duration_weeks} Wochen` : '',
        maxStudents: course.max_students || 0,
        currentStudents: course.enrolled_students || 0,
        status: 'active', // You can improve this logic
        startDate: course.start_date,
        endDate: course.end_date || '',
        schedule: course.schedule || '',
        description: course.description || ''
      })))
      // Optionally, update stats
      setStats(prev => ({
        ...prev,
        totalCourses: coursesResponse.courses.length,
        totalStudents: coursesResponse.courses.reduce((sum, c) => sum + (c.enrolled_students || 0), 0)
      }))
    } catch (error) {
      console.error('Error loading school data:', error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der School-Daten",
        variant: "destructive"
      })
    }
  }

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.price || !newCourse.startDate) {
      toast({
        title: "Fehlende Daten",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive"
      })
      return
    }

    try {
      const payload = {
        school_id: schoolInfo.id, // Ensure this is set!
        title: newCourse.title,
        level: newCourse.level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
        price: newCourse.price,
        duration_weeks: parseInt(newCourse.duration) || 1,
        max_students: newCourse.maxStudents,
        schedule: newCourse.schedule,
        description: newCourse.description,
        start_date: newCourse.startDate,
        end_date: newCourse.endDate,
        category: "general" as 'general' | 'business' | 'exam_prep' | 'conversation', // or let user pick
        is_online: true // or let user pick
      };
      await coursesApi.create(payload);
      toast({
        title: "Kurs hinzugefügt",
        description: `${newCourse.title} wurde erfolgreich erstellt`,
      });
      setShowAddCourseModal(false);
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
      });
      loadSchoolData(); // reload courses from backend
    } catch (error: any) {
      toast({
        title: "Fehler beim Erstellen des Kurses",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Möchten Sie diesen Kurs wirklich löschen?')) return;
    try {
      await coursesApi.delete(courseId);
      toast({
        title: "Kurs gelöscht",
        description: "Der Kurs wurde erfolgreich entfernt",
      });
      loadSchoolData(); // reload courses from backend
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen des Kurses",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  const handleSaveSchoolInfo = () => {
    // Hier würde normalerweise ein API-Aufruf stattfinden
    setIsEditingInfo(false)
    toast({
      title: "Informationen gespeichert",
      description: "Ihre Schulinformationen wurden aktualisiert",
    })
  }

  const handleEditCourse = (course: Course) => {
    setEditCourseData(course)
    setShowEditCourseModal(true)
    setEditFormError(null)
  }

  const handleEditCourseInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setEditCourseData(prev => ({
      ...prev!,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditFormError(null)
    if (!editCourseData?.id || !editCourseData.title || !editCourseData.level || !editCourseData.price) {
      setEditFormError('Please fill in all required fields.')
      return
    }
    setIsUpdating(true)
    try {
      // Cast level to correct type for API
      const updateData = {
        ...editCourseData,
        level: editCourseData.level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      }
      await coursesApi.update(editCourseData.id, updateData)
      toast({ title: 'Kurs erfolgreich aktualisiert', variant: 'default' })
      setShowEditCourseModal(false)
      setEditCourseData(null)
      loadSchoolData()
    } catch (error) {
      setEditFormError(error.message || 'Fehler beim Aktualisieren des Kurses')
      toast({ title: 'Fehler beim Aktualisieren des Kurses', description: error.message, variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
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
          {reviews.length === 0 ? (
            <div className="text-gray-500 text-sm">Noch keine Bewertungen vorhanden.</div>
          ) : (
            reviews.map((review, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-gray-700">
                  {review.reviewer_name || review.studentName} hat Ihren Kurs bewertet: {review.comment} ({review.rating} Sterne)
                </p>
                <span className="text-gray-500 text-sm">{new Date(review.created_at || review.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
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

            {/* Course Reviews */}
            {(courseReviews[course.id] && courseReviews[course.id].length > 0) ? (
              <div className="mt-4 bg-gray-50 rounded p-3">
                <h4 className="font-semibold text-sm mb-2">Bewertungen:</h4>
                {courseReviews[course.id].map((review, idx) => (
                  <div key={idx} className="border-b border-gray-200 py-2 text-sm">
                    <span className="font-medium">{review.reviewer_name}</span>:
                    <span className="ml-2">{review.comment}</span>
                    <span className="ml-2 text-yellow-500">{'★'.repeat(review.rating)}</span>
                    <span className="ml-2 text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-xs text-gray-400">Noch keine Bewertungen für diesen Kurs.</div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditCourse(course)}
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
    <div className="min-h-screen bg-gray-50">
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
      {/* Edit Course Modal */}
      {showEditCourseModal && editCourseData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button onClick={() => setShowEditCourseModal(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 font-bold">×</button>
            <h2 className="text-2xl font-bold mb-4">Kurs bearbeiten</h2>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              {editFormError && <div className="text-red-600 text-sm mb-2">{editFormError}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input name="title" value={editCourseData.title || ''} onChange={handleEditCourseInput} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea name="description" value={editCourseData.description || ''} onChange={handleEditCourseInput} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Level *</label>
                  <select
                    name="level"
                    value={editCourseData.level || ''}
                    onChange={handleEditCourseInput}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="A1">A1 - Anfänger</option>
                    <option value="A2">A2 - Grundkenntnisse</option>
                    <option value="B1">B1 - Fortgeschritten</option>
                    <option value="B2">B2 - Selbständig</option>
                    <option value="C1">C1 - Kompetent</option>
                    <option value="C2">C2 - Muttersprachlich</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Preis (MAD) *</label>
                  <input name="price" type="number" value={editCourseData.price || 0} onChange={handleEditCourseInput} required min={1} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Max. Teilnehmer</label>
                  <input name="max_students" type="number" value={editCourseData.maxStudents || 0} onChange={handleEditCourseInput} min={1} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Dauer (Wochen)</label>
                  <input name="duration" value={editCourseData.duration || ''} onChange={handleEditCourseInput} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Startdatum</label>
                  <input name="startDate" type="date" value={editCourseData.startDate || ''} onChange={handleEditCourseInput} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Enddatum</label>
                  <input name="endDate" type="date" value={editCourseData.endDate || ''} onChange={handleEditCourseInput} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <button type="submit" disabled={isUpdating} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center">
                {isUpdating ? 'Speichern...' : 'Kurs aktualisieren'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolDashboard
