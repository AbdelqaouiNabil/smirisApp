import { useState, useEffect } from 'react'
import { useComparison } from '../../contexts/ComparisonContext'
import { Star, MapPin, Phone, Mail, Globe, Trash2, ExternalLink, Award, Clock, Wifi, Book, Lock } from 'lucide-react'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'
import { Course, coursesApi } from '../../lib/api'


interface School {
  id: number
  name: string
  location: string
  address: string
  phone?: string
  email?: string
  website?: string
  rating: number
  reviewCount: number
  features?: string[]
  coordinates?: { lat: number; lng: number }
  openingHours?: Record<string, string>
  category?: string
  imageUrl?: string
  description?: string
}



export function SchoolComparison() {
  const { getItemsByType, removeItem } = useComparison()
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const schoolItems = getItemsByType('school')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getAll({ limit: 100 })
        const courses = response.courses || []
        setCourses(courses)
      } catch (error) {
        console.error('Error loading courses:', error)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    setSchools(schoolItems.map(item => item.data))
  }, [schoolItems])

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Schulen zum Vergleich ausgewählt
        </h3>
        <p className="text-gray-500 mb-6">
          Wählen Sie bis zu 4 Schulen auf der Schulen-Seite aus, um sie hier zu vergleichen.
        </p>
        <a 
          href="/schools" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Schulen durchsuchen
        </a>
      </div>
    )
  }

  const getSchoolCourses = (schoolId: number) => {
    return courses.filter(course => course.school_id === schoolId)
  }

  const getLowestPrice = (schoolId: number) => {
    const schoolCourses = getSchoolCourses(schoolId)
    if (schoolCourses.length === 0) return null
    return Math.min(...schoolCourses.map(course => course.price))
  }

  const getHighestPrice = (schoolId: number) => {
    const schoolCourses = getSchoolCourses(schoolId)
    if (schoolCourses.length === 0) return null
    return Math.max(...schoolCourses.map(course => course.price))
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    return `${price.toLocaleString()} MAD`
  }

  const formatRating = (rating: any) => {
    const num = Number(rating);
    return isNaN(num) ? 'N/A' : num.toFixed(1);
  };

  const getWinnerIndex = (values: (number | null)[], type: 'min' | 'max') => {
    const validValues = values.map((val, idx) => ({ val, idx })).filter(item => item.val !== null)
    if (validValues.length === 0) return -1
    
    if (type === 'min') {
      return validValues.reduce((min, current) => 
        current.val! < min.val! ? current : min
      ).idx
    } else {
      return validValues.reduce((max, current) => 
        current.val! > max.val! ? current : max
      ).idx
    }
  }

  const getRatingWinnerIndex = () => {
    const ratings = schools.map(school => school.rating)
    return getWinnerIndex(ratings, 'max')
  }

  const getPriceWinnerIndex = () => {
    const prices = schools.map(school => getLowestPrice(school.id))
    return getWinnerIndex(prices, 'min')
  }

  const getReviewCountWinnerIndex = () => {
    const reviewCounts = schools.map(school => school.reviewCount)
    return getWinnerIndex(reviewCounts, 'max')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Schulen-Vergleich ({schools.length} von 4)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Side-by-side Vergleich der wichtigsten Eigenschaften
        </p>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="space-y-6 p-6">
          {schools.map((school, index) => (
            <div key={school.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {school.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {school.location}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(school.id, 'school')}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bewertung:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{formatRating(school.rating)}</span>
                    <span className="text-gray-500 text-sm ml-1">({school.reviewCount})</span>
                    {index === getRatingWinnerIndex() && (
                      <Badge variant="default" className="ml-2 bg-green-600">Beste Bewertung</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preisspanne:</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(getLowestPrice(school.id))} - {formatPrice(getHighestPrice(school.id))}
                    </div>
                    {index === getPriceWinnerIndex() && (
                      <Badge variant="default" className="mt-1 bg-green-600">Günstigste</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kurse:</span>
                  <span className="font-medium">{getSchoolCourses(school.id).length} verfügbar</span>
                </div>

                {school.features && school.features.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Ausstattung:</span>
                    <div className="flex flex-wrap gap-1">
                      {school.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {school.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{school.features.length - 3} weitere
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-3">
                  <a
                    href={`/schools/${school.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Details ansehen
                  </a>
                  {user && user.role === 'student' && school.phone ? (
                    <a
                      href={`tel:${school.phone}`}
                      className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50"
                    >
                      Anrufen
                    </a>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="flex-1 border border-gray-300 text-gray-500 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Geschützt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 w-48">
                Eigenschaften
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {school.imageUrl ? (
                        <img 
                          src={school.imageUrl} 
                          alt={school.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Book className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(school.id, 'school')}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Aus Vergleich entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* School Name */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Schulname
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {school.name}
                  </div>
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Standort
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    {school.location}
                  </div>
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Bewertung
                  <Star className="h-4 w-4 text-yellow-400 ml-2" />
                </div>
              </td>
              {schools.map((school, index) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold">{formatRating(school.rating)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {school.reviewCount} Bewertungen
                      {index === getReviewCountWinnerIndex() && (
                        <div className="mt-1">
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Meiste Reviews
                          </Badge>
                        </div>
                      )}
                    </div>
                    {index === getRatingWinnerIndex() && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Beste Bewertung
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Price Range */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Preisspanne
              </td>
              {schools.map((school, index) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-sm">
                      <div className="font-semibold text-green-600">
                        {formatPrice(getLowestPrice(school.id))}
                      </div>
                      <div className="text-gray-500">
                        bis {formatPrice(getHighestPrice(school.id))}
                      </div>
                    </div>
                    {index === getPriceWinnerIndex() && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Günstigste
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Number of Courses */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Anzahl Kurse
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="font-semibold text-blue-600">
                    {getSchoolCourses(school.id).length}
                  </div>
                  <div className="text-xs text-gray-500">verfügbare Kurse</div>
                </td>
              ))}
            </tr>

            {/* Features */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Ausstattung
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {school.features && school.features.length > 0 ? (
                      <>
                        {school.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {school.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{school.features.length - 3}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">Keine Angaben</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Contact */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Kontakt
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  {user && user.role === 'student' ? (
                    <div className="flex flex-col items-center space-y-1">
                      {school.phone && (
                        <a
                          href={`tel:${school.phone}`}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Anrufen
                        </a>
                      )}
                      {school.email && (
                        <a
                          href={`mailto:${school.email}`}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          E-Mail
                        </a>
                      )}
                      {school.website && (
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center text-gray-400 text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Geschützt
                      </div>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        Anmelden
                      </button>
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Actions */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Aktionen
              </td>
              {schools.map((school) => (
                <td key={school.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col space-y-2">
                    <a
                      href={`/schools/${school.id}`}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Details
                    </a>
                    <button className="inline-flex items-center justify-center px-3 py-2 border border-blue-600 text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                      Jetzt buchen
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
