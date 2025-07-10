import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Euro, Users, Star, Calendar, BookOpen, Award, Phone, Mail } from 'lucide-react'
import { coursesApi, schoolsApi, Course, School, ApiError } from '../lib/api'
import { ComparisonButton } from '../components/comparison/ComparisonButton'

export default function CourseDetailPage() {
  console.log('CourseDetailPage: Component rendered')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourseDetails = async () => {
      console.log('CourseDetailPage: Loading course with ID:', id)
      
      if (!id) {
        console.error('CourseDetailPage: No ID provided')
        setError('Keine Kurs-ID angegeben')
        setLoading(false)
        return
      }
      
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        console.error('CourseDetailPage: Invalid ID format:', id)
        setError('Ungültige Kurs-ID Format')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        console.log('CourseDetailPage: Making API call for course ID:', numericId)
        const courseResponse = await coursesApi.getById(numericId)
        console.log('CourseDetailPage: Course response:', courseResponse)
        setCourse(courseResponse.course)
        
        if (courseResponse.course.school_id) {
          console.log('CourseDetailPage: Loading school with ID:', courseResponse.course.school_id)
          const schoolResponse = await schoolsApi.getById(courseResponse.course.school_id)
          console.log('CourseDetailPage: School response:', schoolResponse)
          setSchool(schoolResponse.school)
        }
      } catch (err) {
        console.error('Error loading course details:', err)
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Ein Fehler ist aufgetreten beim Laden der Kursdetails.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadCourseDetails()
  }, [id])

  const handleBookCourse = () => {
    if (course) {
      navigate(`/booking/course/${course.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Kursdetails...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kurs nicht gefunden</h2>
          <p className="text-gray-600 mb-6">{error || 'Der angeforderte Kurs konnte nicht gefunden werden.'}</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Zurück zu den Kursen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/courses')}
            className="text-red-600 hover:text-red-700 mb-4 flex items-center"
          >
            ← Zurück zu den Kursen
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {course.title}
          </h1>
          {school && (
            <p className="text-xl text-gray-600">{school.name}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Image */}
            {course.image_url && (
              <div className="mb-8">
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Course Description */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kursbeschreibung</h2>
              <p className="text-gray-700 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kursdetails</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Sprachniveau</p>
                      <p className="font-medium">{course.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Dauer</p>
                      <p className="font-medium">
                        {course.duration_weeks ? `${course.duration_weeks} Wochen` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Startdatum</p>
                      <p className="font-medium">
                        {new Date(course.start_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Zeitplan</p>
                      <p className="font-medium">{course.schedule || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Standort</p>
                      <p className="font-medium">{course.school_location}</p>
                    </div>
                  </div>
                                     <div className="flex items-center">
                     <Award className="w-5 h-5 text-red-600 mr-3" />
                     <div>
                       <p className="text-sm text-gray-500">Kategorie</p>
                       <p className="font-medium">{course.category}</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Euro className="w-6 h-6 text-green-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">
                    {Number(course.price).toLocaleString()}
                  </span>
                  <span className="text-gray-600 ml-1">MAD</span>
                </div>
                <p className="text-sm text-gray-600">Gesamtpreis für den Kurs</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleBookCourse}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                >
                  Jetzt buchen
                </button>
                
                <ComparisonButton
                  item={{
                    id: course.id,
                    type: 'course',
                    data: course
                  }}
                  variant="default"
                  className="w-full"
                />
              </div>
            </div>

            {/* School Information */}
            {school && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprachschule</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{school.name}</h4>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm text-gray-600">{school.rating} Bewertung</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{school.location}</span>
                    </div>
                    {school.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    {school.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{school.email}</span>
                      </div>
                    )}
                  </div>

                  {school.description && (
                    <p className="text-sm text-gray-600 mt-4">
                      {school.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 