import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, BookOpen, Phone, Mail, Globe, MapPin, Star, Lock, MessageSquare } from 'lucide-react'
import { ComparisonButton } from '../components/comparison/ComparisonButton'
import { ProtectedContact } from '../components/ProtectedContact'
import { SchoolReviewSystem } from '../components/SchoolReviewSystem'
import { useAuth } from '../contexts/AuthContext'
import { schoolsApi, coursesApi, School, Course, ApiError } from '../lib/api'

export default function SchoolsPage() {
  const { t } = useTranslation('schools')
  const { user } = useAuth()
  
  // Core state with safe initialization
  const [schools, setSchools] = useState<School[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [originalSchools, setOriginalSchools] = useState<School[]>([])
  const [originalCourses, setOriginalCourses] = useState<Course[]>([])
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [filterCity, setFilterCity] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [courseSearchTerm, setCourseSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'schools' | 'courses'>('schools')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Loading data from API...')
        
        const [schoolsResponse, coursesResponse] = await Promise.all([
          schoolsApi.getAll({ limit: 100 }),
          coursesApi.getAll({ limit: 100 })
        ])
        
        const schoolsData = schoolsResponse.schools || []
        const coursesData = coursesResponse.courses || []
        
        console.log('✅ Loaded schools:', schoolsData.length)
        console.log('✅ Loaded courses:', coursesData.length)
        
        setSchools([...schoolsData])
        setCourses([...coursesData])
        setOriginalSchools([...schoolsData])
        setOriginalCourses([...coursesData])
        
      } catch (error) {
        console.error('❌ Error loading data:', error)
        if (error instanceof ApiError) {
          setError(`API Error: ${error.message}`)
        } else {
          setError('Failed to connect to the server. Please check your internet connection.')
        }
        setSchools([])
        setCourses([])
        setOriginalSchools([])
        setOriginalCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Safe filtering functions
  const filteredSchools = (schools || []).filter(school => {
    if (!school) return false
    
    const matchesCity = !filterCity || school.location === filterCity
    const matchesSearch = !searchTerm || 
      (school.name && school.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.location && school.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCity && matchesSearch
  })

  const filteredCourses = (courses || []).filter(course => {
    if (!course) return false
    
    const school = (originalSchools || []).find(s => s && s.id === course.school_id)
    const matchesSearch = !courseSearchTerm || 
      (course.title && course.title.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
      (course.level && course.level.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
      (school && school.name && school.name.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
      (school && school.location && school.location.toLowerCase().includes(courseSearchTerm.toLowerCase()))
    
    return matchesSearch
  })

  // Safe cities extraction
  const cities = [...new Set((originalSchools || []).map(school => school?.location).filter(Boolean))]

  // Fixed reset filters function
  const resetFilters = () => {
    console.log('🔄 Resetting filters...')
    setFilterCity('')
    setSearchTerm('')
    // Restore from original data
    setSchools([...originalSchools])
    console.log('✅ Reset complete. Showing', originalSchools.length, 'schools')
  }

  // Fixed reset course filters
  const resetCourseFilters = () => {
    console.log('🔄 Resetting course filters...')
    setCourseSearchTerm('')
    setCourses([...originalCourses])
    console.log('✅ Course reset complete. Showing', originalCourses.length, 'courses')
  }

  // Fixed tab switching with debugging
  const handleTabSwitch = (tab: 'schools' | 'courses') => {
    console.log('🔄 Tab switch requested:', tab)
    console.log('🔄 Current activeTab:', activeTab)
    
    // Force state update
    setActiveTab(tab)
    
    // Restore data if needed
    if (tab === 'schools' && schools.length === 0 && originalSchools.length > 0) {
      console.log('🔄 Restoring schools data')
      setSchools([...originalSchools])
    }
    if (tab === 'courses' && courses.length === 0 && originalCourses.length > 0) {
      console.log('🔄 Restoring courses data')
      setCourses([...originalCourses])
    }
    
    console.log('✅ Tab switched to:', tab)
    
    // Force re-render by updating a timestamp
    setTimeout(() => {
      console.log('🔄 Tab switch verification - activeTab is now:', activeTab)
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Daten werden geladen...</p>
          <p className="text-gray-500 text-sm">Lädt 253 Schulen und 1518 Kurse...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fehler beim Laden der Daten</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Seite neu laden
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            Deutsche Sprachschulen in Marokko
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Finden Sie die perfekte deutsche Sprachschule für Ihr Niveau
          </p>
          
          {/* Debug info in development */}
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-sm">
              🔧 <strong>Debug Info:</strong> activeTab = '{activeTab}' | 
              Schools: {originalSchools.length} | 
              Courses: {originalCourses.length} | 
              Filtered Schools: {filteredSchools.length} | 
              Filtered Courses: {filteredCourses.length}
            </p>
          </div>
          
          {/* Fixed Tabs with enhanced event handling */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ SCHOOLS TAB CLICKED')
                handleTabSwitch('schools')
              }}
              className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'schools'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Écoles de langues ({filteredSchools.length})
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ COURSES TAB CLICKED')
                handleTabSwitch('courses')
              }}
              className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'courses'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Cours ({filteredCourses.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Schools Tab Content */}
        {activeTab === 'schools' && (
          <div key="schools-content">
            {/* School Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stadt auswählen
                  </label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Alle Städte</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nach Name suchen
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Schulname eingeben..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-600 text-center md:text-left">
                  <span className="font-medium text-lg">{filteredSchools.length}</span> von {originalSchools.length} Schulen
                  {(filterCity || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Schools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSchools.map(school => school && (
                <div key={school.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {school.name || 'Unbekannte Schule'}
                      </h3>
                      {school.rating > 0 && (
                        <div className="flex items-center bg-green-50 px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-medium text-green-700">
                            {school.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{school.location || 'Unbekannter Ort'}</span>
                    </div>

                    {school.review_count > 0 && (
                      <p className="text-sm text-gray-600 mb-4">
                        {school.review_count} Bewertungen
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(school.features || []).slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <ProtectedContact
                        phone={school.phone}
                        email={school.email}
                        website={school.website}
                        schoolName={school.name || 'Schule'}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedSchool(school)}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Details ansehen
                        </button>
                        <ComparisonButton
                          item={{
                            id: school.id,
                            type: 'school',
                            data: school
                          }}
                          variant="small"
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredSchools.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Keine Schulen gefunden
                </h3>
                <p className="text-gray-600 mb-4">
                  Versuchen Sie es mit einer anderen Stadt oder einem anderen Suchbegriff
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Alle {originalSchools.length} Schulen anzeigen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <div key="courses-content">
            {/* Course Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nach Kurs suchen
                  </label>
                  <input
                    type="text"
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    placeholder="Kursname, Level oder Schule eingeben..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-600 text-center md:text-left">
                  <span className="font-medium text-lg">{filteredCourses.length}</span> von {originalCourses.length} Kursen
                  {courseSearchTerm && (
                    <button
                      onClick={resetCourseFilters}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredCourses.map(course => {
                if (!course) return null
                const school = (originalSchools || []).find(s => s && s.id === course.school_id)
                return (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {course.title || 'Unbekannter Kurs'}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {course.level || 'N/A'}
                        </span>
                      </div>

                      {school && (
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{school.name} - {school.location}</span>
                        </div>
                      )}

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {course.description || 'Keine Beschreibung verfügbar'}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dauer:</span>
                          <span className="font-medium">{course.duration_weeks ? `${course.duration_weeks} Wochen` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Zeitplan:</span>
                          <span className="font-medium">{course.schedule || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Preis:</span>
                          <span className="font-bold text-green-600">{course.price || 0} MAD</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {course.enrolled_students || 0}/{course.max_students || 0} Teilnehmer
                        </div>
                        <button
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            (course.enrolled_students || 0) < (course.max_students || 0)
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={(course.enrolled_students || 0) >= (course.max_students || 0)}
                        >
                          {(course.enrolled_students || 0) < (course.max_students || 0) ? 'Jetzt buchen' : 'Ausgebucht'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <BookOpen size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Keine Kurse gefunden
                </h3>
                <p className="text-gray-600 mb-4">
                  Versuchen Sie es mit einem anderen Suchbegriff
                </p>
                <button
                  onClick={resetCourseFilters}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Alle {originalCourses.length} Kurse anzeigen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* School Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedSchool.name || 'Unbekannte Schule'}
                  </h2>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{selectedSchool.location || 'Unbekannter Ort'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Kontaktinformationen</h3>
                  <div className="space-y-3">
                    {/* Öffentliche Adresse (nur Stadt) */}
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-gray-600">{selectedSchool.location}</span>
                    </div>
                    
                    {/* Geschützte Kontaktdaten */}
                    {user && user.role === 'student' ? (
                      <>
                        {selectedSchool.address && (
                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                            <span className="text-gray-600 font-medium">Vollständige Adresse:</span>
                          </div>
                        )}
                        {selectedSchool.address && (
                          <div className="ml-8 text-gray-600 bg-green-50 p-3 rounded-md">
                            {selectedSchool.address}
                          </div>
                        )}
                        {selectedSchool.phone && (
                          <div className="flex items-center">
                            <Phone className="w-5 h-5 text-gray-400 mr-3" />
                            <a href={`tel:${selectedSchool.phone}`} className="text-blue-600 hover:underline font-medium">
                              {selectedSchool.phone}
                            </a>
                          </div>
                        )}
                        {selectedSchool.email && (
                          <div className="flex items-center">
                            <Mail className="w-5 h-5 text-gray-400 mr-3" />
                            <a href={`mailto:${selectedSchool.email}`} className="text-blue-600 hover:underline">
                              {selectedSchool.email}
                            </a>
                          </div>
                        )}
                        {selectedSchool.website && (
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 text-gray-400 mr-3" />
                            <a href={selectedSchool.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Website besuchen
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">Vollständige Kontaktdaten geschützt</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Melden Sie sich als Student an, um Telefonnummer, E-Mail und vollständige Adresse zu sehen.
                        </p>
                        <button
                          onClick={() => window.location.href = '/login'}
                          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Jetzt anmelden
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Bewertungen & Features</h3>
                  {selectedSchool.rating > 0 && (
                    <div className="flex items-center mb-4">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                      <span className="text-lg font-medium">{selectedSchool.rating}</span>
                      <span className="text-gray-600 ml-2">({selectedSchool.review_count || 0} Bewertungen)</span>
                    </div>
                  )}
                  
                  {selectedSchool.features && selectedSchool.features.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSchool.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bewertungssystem */}
              <div className="mt-8 border-t pt-6">
                <SchoolReviewSystem 
                  schoolId={selectedSchool.id} 
                  schoolName={selectedSchool.name || 'Schule'} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}