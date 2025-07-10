import { useState, useEffect } from 'react'
import { useComparison } from '../contexts/ComparisonContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { SchoolComparison } from '../components/comparison/SchoolComparison'
import { CourseComparison } from '../components/comparison/CourseComparison'
import { TutorComparison } from '../components/comparison/TutorComparison'
import { Badge } from '../components/ui/badge'
import { GraduationCap, BookOpen, User, Trash2 } from 'lucide-react'

export default function ComparisonPage() {
  const { getItemsByType, clearItems } = useComparison()
  const [activeTab, setActiveTab] = useState('schools')

  const schoolsCount = getItemsByType('school').length
  const coursesCount = getItemsByType('course').length
  const tutorsCount = getItemsByType('tutor').length

  // Auto-switch to first tab with items
  useEffect(() => {
    if (schoolsCount > 0) setActiveTab('schools')
    else if (coursesCount > 0) setActiveTab('courses')
    else if (tutorsCount > 0) setActiveTab('tutors')
  }, [schoolsCount, coursesCount, tutorsCount])

  const totalItems = schoolsCount + coursesCount + tutorsCount

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vergleich
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Hier können Sie bis zu 4 Schulen, Kurse oder Tutoren direkt miteinander vergleichen. 
              Fügen Sie Artikel zum Vergleich hinzu, indem Sie auf den "Vergleichen"-Button auf der jeweiligen Seite klicken.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Schulen vergleichen</h3>
                <p className="text-gray-600 text-sm">
                  Vergleichen Sie Preise, Bewertungen, Standorte und Ausstattung von bis zu 4 Sprachschulen.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kurse vergleichen</h3>
                <p className="text-gray-600 text-sm">
                  Finden Sie den besten Kurs durch Vergleich von Preisen, Dauer, Level und Zeitplänen.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <User className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutoren vergleichen</h3>
                <p className="text-gray-600 text-sm">
                  Vergleichen Sie Stundensätze, Erfahrung, Spezialisierungen und Verfügbarkeiten.
                </p>
              </div>
            </div>
            
            <div className="mt-12 space-x-4">
              <a 
                href="/schools" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Schulen durchsuchen
              </a>
              <a 
                href="/courses" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Kurse entdecken
              </a>
              <a 
                href="/tutors" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Tutoren finden
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vergleich</h1>
              <p className="mt-2 text-gray-600">
                Vergleichen Sie bis zu 4 Artikel direkt miteinander
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {totalItems} von 12 möglichen Artikeln
              </div>
              <button
                onClick={() => clearItems()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Alle löschen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schools" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Schulen</span>
              {schoolsCount > 0 && (
                <Badge variant="secondary" className="ml-2">{schoolsCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Kurse</span>
              {coursesCount > 0 && (
                <Badge variant="secondary" className="ml-2">{coursesCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tutors" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Tutoren</span>
              {tutorsCount > 0 && (
                <Badge variant="secondary" className="ml-2">{tutorsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="mt-8">
            <SchoolComparison />
          </TabsContent>

          <TabsContent value="courses" className="mt-8">
            <CourseComparison />
          </TabsContent>

          <TabsContent value="tutors" className="mt-8">
            <TutorComparison />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
