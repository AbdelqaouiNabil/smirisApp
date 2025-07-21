import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, MapPin, Clock, Euro, Users, Star } from 'lucide-react'
import { ComparisonButton } from '../components/comparison/ComparisonButton'
import { coursesApi, schoolsApi, Course, School, ApiError } from '../lib/api'
import { toast } from '../hooks/use-toast'

export default function CoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    city: '',
    priceRange: '',
    startDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    participants: 1,
    notes: ''
  });

  useEffect(() => {
    // Load courses and schools data from API
    const loadData = async () => {
      try {
        const [coursesResponse, schoolsResponse] = await Promise.all([
          coursesApi.getAll({ limit: 100 }),
          schoolsApi.getAll({ limit: 100 })
        ])
        
        const coursesData = coursesResponse.courses || []
        const schoolsData = schoolsResponse.schools || []
        
        setCourses(coursesData)
        setSchools(schoolsData)
        setFilteredCourses(coursesData)
      } catch (error) {
        console.error('Error loading data:', error)
        if (error instanceof ApiError) {
          console.error('API Error:', error.message)
        }
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           course.description.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesLevel = !filters.level || course.level === filters.level
      const matchesCity = !filters.city || (course.school_location && course.school_location === filters.city)
      
      const matchesPrice = !filters.priceRange || (() => {
        switch (filters.priceRange) {
          case 'under500': return Number(course.price) < 500
          case '500-1000': return Number(course.price) >= 500 && Number(course.price) <= 1000
          case 'over1000': return Number(course.price) > 1000
          default: return true
        }
      })()

      return matchesSearch && matchesLevel && matchesCity && matchesPrice
    })

    setFilteredCourses(filtered)
  }, [courses, filters])

  const getSchoolInfo = (schoolId: number) => {
    return schools.find(school => school.id === schoolId)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      level: '',
      city: '',
      priceRange: '',
      startDate: ''
    })
  }

  const handleViewDetails = (courseId: number) => {
    console.log('Navigating to course details:', courseId)
    
    if (!courseId || isNaN(courseId)) {
      console.error('Invalid course ID:', courseId)
      return
    }
    
    navigate(`/courses/${courseId}`)
  }

  const openBookingModal = (course: Course) => {
    setSelectedCourse(course);
    setShowBookingModal(true);
    setBookingData({ date: '', participants: 1, notes: '' });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !bookingData.date) {
      toast({ title: 'Bitte wählen Sie ein Datum.', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        booking_type: 'course',
        course_id: selectedCourse.id,
        start_date: bookingData.date,
        participants: bookingData.participants,
        notes: bookingData.notes
      };
      await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
        },
        body: JSON.stringify(payload)
      });
      setShowBookingModal(false);
      toast({ title: 'Buchung erfolgreich!', description: 'Ihre Buchung wurde gespeichert.', variant: 'default' });
    } catch (error: any) {
      toast({ title: 'Fehler bei der Buchung', description: error.message, variant: 'destructive' });
    }
  };

  const cities = [...new Set((courses || []).map(course => course.school_location).filter(Boolean))]
  const levels = [...new Set((courses || []).map(course => course.level).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Deutsche Sprachkurse
          </h1>
          <p className="text-xl text-gray-600">
            Finden Sie den perfekten Deutschkurs für Ihr Sprachniveau und Ihre Ziele
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Zurücksetzen
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Kurs suchen..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprachniveau
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Alle Niveaus</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stadt
                </label>
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Alle Städte</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preis
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Alle Preise</option>
                  <option value="under500">Unter 500MAD</option>
                  <option value="500-1000">500MAD - 1000MAD</option>
                  <option value="over1000">Über 1000MAD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredCourses.length} Kurse gefunden
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md"
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(filteredCourses || []).map(course => {
                const school = getSchoolInfo(course.school_id)
                return (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {course.level}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          {school && (
                            <>
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span>{school.rating}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      
                      {school && (
                        <p className="text-sm text-gray-600 mb-3">{school.name}</p>
                      )}
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{course.school_location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{course.duration_weeks ? `${course.duration_weeks} Wochen` : 'N/A'} • {course.schedule || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Start: {new Date(course.start_date).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>



                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Euro className="w-5 h-5 text-green-600 mr-1" />
                          <span className="text-2xl font-bold text-gray-900">
                            {Number(course.price).toLocaleString()}
                          </span>
                          <span className="text-gray-600 ml-1">MAD</span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewDetails(course.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
                          >
                            Details ansehen
                          </button>
                          <ComparisonButton
                            item={{
                              id: course.id,
                              type: 'course',
                              data: course
                            }}
                            variant="small"
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Keine Kurse gefunden
                </h3>
                <p className="text-gray-600 mb-4">
                  Versuchen Sie es mit anderen Filterkriterien
                </p>
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Kurs buchen: {selectedCourse.title}</h2>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum wählen *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.date}
                  onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teilnehmer</label>
                <input
                  type="number"
                  min={1}
                  max={selectedCourse.max_students || 20}
                  value={bookingData.participants}
                  onChange={e => setBookingData({ ...bookingData, participants: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
                <textarea
                  value={bookingData.notes}
                  onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Besondere Wünsche oder Anforderungen..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Buchung abschließen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
