import { useState, useEffect } from 'react'
import { useComparison } from '../../contexts/ComparisonContext'
import { Clock, Users, Calendar, Euro, Trash2, ExternalLink, BookOpen, GraduationCap } from 'lucide-react'
import { Badge } from '../ui/badge'
import { schoolsApi } from '../../lib/api'
import type { School as ApiSchool } from '../../lib/api'

interface Course {
  id: number
  schoolId: number
  title: string
  level: string
  duration: string
  price: number
  description: string
  maxStudents: number
  currentStudents: number
  schedule: string
  startDate: string
  endDate?: string
  image?: string
}

interface School extends ApiSchool {
  reviewCount: number
}

export function CourseComparison() {
  const { getItemsByType, removeItem } = useComparison()
  const [courses, setCourses] = useState<Course[]>([])
  const [schools, setSchools] = useState<School[]>([])

  const courseItems = getItemsByType('course')

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await schoolsApi.getAll({ limit: 100 })
        // Map API schools to our School interface
        const mappedSchools = (response.schools || []).map(school => ({
          ...school,
          reviewCount: school.review_count || 0
        }))
        setSchools(mappedSchools)
      } catch (error) {
        console.error('Error loading schools:', error)
      }
    }

    fetchSchools()
  }, [])

  useEffect(() => {
    setCourses(courseItems.map(item => item.data))
  }, [courseItems])

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine Kurse zum Vergleich ausgewählt
        </h3>
        <p className="text-gray-500 mb-6">
          Wählen Sie bis zu 4 Kurse auf der Kurse-Seite aus, um sie hier zu vergleichen.
        </p>
        <a 
          href="/courses" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Kurse durchsuchen
        </a>
      </div>
    )
  }

  const getSchool = (schoolId: number) => {
    return schools.find(school => school.id === schoolId)
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} MAD`
  }

  const getPricePerHour = (course: Course) => {
    try {
      // If duration is undefined or not in the expected format, use default of 8 weeks
      const durationString = course.duration || '8 weeks';
      const weeks = parseInt(durationString.split(' ')[0]) || 8;
      const totalHours = weeks * 5 * 3; // 5 days a week, 3 hours per day
      return Math.round(course.price / totalHours);
    } catch (error) {
      console.error('Error calculating price per hour:', error);
      // Return a fallback calculation using 8 weeks as default
      return Math.round(course.price / (8 * 5 * 3));
    }
  }

  const getAvailableSpots = (course: Course) => {
    return course.maxStudents - course.currentStudents
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
    const prices = courses.map(course => course.price)
    return getWinnerIndex(prices, 'min')
  }

  const getSpotWinnerIndex = () => {
    const spots = courses.map(course => getAvailableSpots(course))
    return getWinnerIndex(spots, 'max')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getLevelColor = (level: string) => {
    const colors = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-green-200 text-green-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-yellow-200 text-yellow-800',
      'C1': 'bg-red-100 text-red-800',
      'C2': 'bg-red-200 text-red-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Kurs-Vergleich ({courses.length} von 4)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Vergleichen Sie Preise, Level, Dauer und weitere Details
        </p>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="space-y-6 p-6">
          {courses.map((course, index) => {
            const school = getSchool(course.schoolId)
            return (
              <div key={course.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {course.title}
                    </h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {school?.name}
                    </div>
                    <Badge className={`text-xs ${getLevelColor(course.level)}`}>
                      {course.level}
                    </Badge>
                  </div>
                  <button
                    onClick={() => removeItem(course.id, 'course')}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Preis:</span>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-green-600">
                        {formatPrice(course.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ~{getPricePerHour(course)} MAD/Stunde
                      </div>
                      {index === getPriceWinnerIndex() && (
                        <Badge variant="default" className="mt-1 bg-green-600">Günstigste</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dauer:</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zeitplan:</span>
                    <span className="font-medium">{course.schedule}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verfügbare Plätze:</span>
                    <div className="text-right">
                      <span className="font-medium">{getAvailableSpots(course)} von {course.maxStudents}</span>
                      {index === getSpotWinnerIndex() && getAvailableSpots(course) > 0 && (
                        <Badge variant="default" className="ml-2 bg-blue-600">Meiste Plätze</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Startdatum:</span>
                    <span className="font-medium">{formatDate(course.startDate)}</span>
                  </div>

                  <div className="flex space-x-2 pt-3">
                    <a
                      href={`/courses/${course.id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Details ansehen
                    </a>
                    <button className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-50">
                      Jetzt buchen
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {course.image ? (
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(course.id, 'course')}
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
            {/* Course Title */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Kursname
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {course.title}
                  </div>
                </td>
              ))}
            </tr>

            {/* School */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Schule
              </td>
              {courses.map((course) => {
                const school = getSchool(course.schoolId)
                return (
                  <td key={course.id} className="px-6 py-4 text-center">
                    <div className="text-sm">
                      <div className="font-medium">{school?.name}</div>
                      <div className="text-gray-500">{school?.location}</div>
                    </div>
                  </td>
                )
              })}
            </tr>

            {/* Level */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Level
                  <GraduationCap className="h-4 w-4 text-blue-500 ml-2" />
                </div>
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <Badge className={`text-sm ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Preis
                  <Euro className="h-4 w-4 text-green-500 ml-2" />
                </div>
              </td>
              {courses.map((course, index) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-semibold text-lg text-green-600">
                      {formatPrice(course.price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{getPricePerHour(course)} MAD/Stunde
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

            {/* Duration */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Dauer
                  <Clock className="h-4 w-4 text-blue-500 ml-2" />
                </div>
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="font-medium">{course.duration}</div>
                </td>
              ))}
            </tr>

            {/* Schedule */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Zeitplan
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="text-sm font-medium">{course.schedule}</div>
                </td>
              ))}
            </tr>

            {/* Available Spots */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Verfügbare Plätze
                  <Users className="h-4 w-4 text-blue-500 ml-2" />
                </div>
              </td>
              {courses.map((course, index) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-sm">
                      <span className="font-semibold text-blue-600">
                        {getAvailableSpots(course)}
                      </span>
                      <span className="text-gray-500"> von {course.maxStudents}</span>
                    </div>
                    {index === getSpotWinnerIndex() && getAvailableSpots(course) > 0 && (
                      <Badge variant="default" className="bg-blue-600 text-xs">
                        Meiste Plätze
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Start Date */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  Startdatum
                  <Calendar className="h-4 w-4 text-green-500 ml-2" />
                </div>
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="font-medium text-sm">
                    {formatDate(course.startDate)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Actions */}
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Aktionen
              </td>
              {courses.map((course) => (
                <td key={course.id} className="px-6 py-4 text-center">
                  <div className="flex flex-col space-y-2">
                    <a
                      href={`/courses/${course.id}`}
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
