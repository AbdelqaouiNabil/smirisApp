import { useState, useEffect } from 'react'
import { useComparison } from '../../contexts/ComparisonContext'
import { Star, Clock, Users, Euro, Trash2, ExternalLink, User, Award, Languages, MapPin } from 'lucide-react'
import { Badge } from '../ui/badge'

interface Tutor {
  id: number
  name: string
  photo?: string
  hourlyRate: number
  specializations: string[]
  languages: string[]
  experience: string
  education: string
  rating: number
  totalLessons: number
  reviewCount: number
  availability?: Record<string, string[]>
  description: string
  teachingStyle: string
  city: string
}

export function TutorComparison() {
  const { getItemsByType, removeItem } = useComparison()
  const [tutors, setTutors] = useState<Tutor[]>([])

  const tutorItems = getItemsByType('tutor')

  useEffect(() => {
    setTutors(tutorItems.map(item => item.data))
  }, [tutorItems])

  if (tutors.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Tutoren zum Vergleich ausgewählt
        </h3>
        <p className="text-gray-500 mb-6">
          Wählen Sie bis zu 4 Tutoren auf der Tutoren-Seite aus, um sie hier zu vergleichen.
        </p>
        <a 
          href="/tutors" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Tutoren durchsuchen
        </a>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return `${price} MAD/Stunde`
  }

  const formatRating = (rating: number) => {
    return rating.toFixed(1)
  }

  const getExperienceYears = (experience: string) => {
    const match = experience.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  const getAvailableHours = (availability?: Record<string, string[]>) => {
    if (!availability) return 0
    return Object.values(availability).reduce((total, hours) => total + hours.length, 0)
  }

  const getWinnerIndex = (values: number[], type: 'min' | 'max') => {
    if (values.length === 0) return -1
    
    if (type === 'min') {
      return values.indexOf(Math.min(...values))
    } else {
      return values.indexOf(Math.max(...values))
    }
  }

  const getPriceWinnerIndex = () => {
    const prices = tutors.map(tutor => tutor.hourlyRate)
    return getWinnerIndex(prices, 'min')
  }

  const getRatingWinnerIndex = () => {
    const ratings = tutors.map(tutor => tutor.rating)
    return getWinnerIndex(ratings, 'max')
  }

  const getExperienceWinnerIndex = () => {
    const experiences = tutors.map(tutor => getExperienceYears(tutor.experience))
    return getWinnerIndex(experiences, 'max')
  }

  const getLessonsWinnerIndex = () => {
    const lessons = tutors.map(tutor => tutor.totalLessons)
    return getWinnerIndex(lessons, 'max')
  }

  const getAvailabilityWinnerIndex = () => {
    const availabilities = tutors.map(tutor => getAvailableHours(tutor.availability))
    return getWinnerIndex(availabilities, 'max')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Tutor-Vergleich ({tutors.length} von 4)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Vergleichen Sie Preise, Erfahrung, Bewertungen und Verfügbarkeit
        </p>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="space-y-6 p-6">
          {tutors.map((tutor, index) => (
            <div key={tutor.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {tutor.photo ? (
                      <img 
                        src={tutor.photo} 
                        alt={tutor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {tutor.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {tutor.city}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(tutor.id, 'tutor')}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stundensatz:</span>
                  <div className="text-right">
                    <div className="font-semibold text-lg text-green-600">
                      {formatPrice(tutor.hourlyRate)}
                    </div>
                    {index === getPriceWinnerIndex() && (
                      <Badge variant="default" className="mt-1 bg-green-600">Günstigste</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bewertung:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{formatRating(tutor.rating)}</span>
                    <span className="text-gray-500 text-sm ml-1">({tutor.reviewCount})</span>
                    {index === getRatingWinnerIndex() && (
                      <Badge variant="default" className="ml-2 bg-green-600">Beste</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Erfahrung:</span>
                  <div className="text-right">
                    <span className="font-medium">{tutor.experience}</span>
                    {index === getExperienceWinnerIndex() && (
                      <Badge variant="default" className="ml-2 bg-blue-600">Meiste</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stunden gegeben:</span>
                  <div className="text-right">
                    <span className="font-medium">{tutor.totalLessons}</span>
                    {index === getLessonsWinnerIndex() && (
                      <Badge variant="default" className="ml-2 bg-purple-600">Meiste</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600 block mb-2">Spezialisierungen:</span>
                  <div className="flex flex-wrap gap-1">
                    {tutor.specializations.slice(0, 3).map((spec, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {tutor.specializations.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tutor.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <a
                    href={`/tutors/${tutor.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Profil ansehen
                  </a>
                  <button className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50">
                    Buchen
                  </button>
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
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {tutor.photo ? (
                        <img 
                          src={tutor.photo} 
                          alt={tutor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(tutor.id, 'tutor')}
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
            {/* Tutor Name */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Name
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {tutor.name}
                  </div>
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Standort
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    {tutor.city}
                  </div>
                </td>
              ))}
            </tr>

            {/* Hourly Rate */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Stundensatz
                  <Euro className="h-4 w-4 text-green-500 ml-2" />
                </div>
              </td>
              {tutors.map((tutor, index) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-semibold text-lg text-green-600">
                      {formatPrice(tutor.hourlyRate)}
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

            {/* Rating */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Bewertung
                  <Star className="h-4 w-4 text-yellow-400 ml-2" />
                </div>
              </td>
              {tutors.map((tutor, index) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold">{formatRating(tutor.rating)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {tutor.reviewCount} Bewertungen
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

            {/* Experience */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Erfahrung
                  <Award className="h-4 w-4 text-blue-500 ml-2" />
                </div>
              </td>
              {tutors.map((tutor, index) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-medium text-sm">{tutor.experience}</div>
                    {index === getExperienceWinnerIndex() && (
                      <Badge variant="default" className="bg-blue-600 text-xs">
                        Meiste Erfahrung
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Total Lessons */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Gegebene Stunden
                  <Clock className="h-4 w-4 text-purple-500 ml-2" />
                </div>
              </td>
              {tutors.map((tutor, index) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-semibold text-purple-600">
                      {tutor.totalLessons}
                    </div>
                    <div className="text-xs text-gray-500">Stunden</div>
                    {index === getLessonsWinnerIndex() && (
                      <Badge variant="default" className="bg-purple-600 text-xs">
                        Meiste Stunden
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Education */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Ausbildung
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="text-sm">{tutor.education}</div>
                </td>
              ))}
            </tr>

            {/* Specializations */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Spezialisierungen
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {tutor.specializations.slice(0, 2).map((spec, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {tutor.specializations.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tutor.specializations.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Languages */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Sprachen
                  <Languages className="h-4 w-4 text-green-500 ml-2" />
                </div>
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    {tutor.languages.slice(0, 3).map((lang, idx) => (
                      <div key={idx} className="text-gray-600">{lang}</div>
                    ))}
                    {tutor.languages.length > 3 && (
                      <div className="text-gray-500">+{tutor.languages.length - 3} weitere</div>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Availability */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Verfügbarkeit
              </td>
              {tutors.map((tutor, index) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-semibold text-blue-600">
                      {getAvailableHours(tutor.availability)} Std/Woche
                    </div>
                    {index === getAvailabilityWinnerIndex() && (
                      <Badge variant="default" className="bg-blue-600 text-xs">
                        Flexibelste
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Actions */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Aktionen
              </td>
              {tutors.map((tutor) => (
                <td key={tutor.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col space-y-2">
                    <a
                      href={`/tutors/${tutor.id}`}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Profil
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
