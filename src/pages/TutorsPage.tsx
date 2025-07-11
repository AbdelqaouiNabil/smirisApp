import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/de'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { Star, MapPin, Clock, Euro, Filter, Search, Users, Award, CheckCircle, Video, Globe, MessageCircle } from 'lucide-react'
import { ComparisonButton } from '../components/comparison/ComparisonButton'
import { TutorTimeSelector } from '../components/TutorTimeSelector'
import { tutorsApi, Tutor, ApiError } from '../lib/api'

// Lokalisierung für deutsche Sprache
moment.locale('de')
const localizer = momentLocalizer(moment)

interface Availability {
  tutorId: number
  date: string
  availableSlots: string[]
  bookedSlots: string[]
  blockedSlots: string[]
}

interface BookingData {
  tutorId: number
  date: string
  time: string
  duration: number
  subject: string
  notes?: string
}

export default function TutorsPage() {
  const { t } = useTranslation('tutors')
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingData, setBookingData] = useState<BookingData>({
    tutorId: 0,
    date: '',
    time: '',
    duration: 60,
    subject: '',
    notes: ''
  })

  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    priceRange: '',
    city: '',
    availability: '',
    rating: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const tutorsResponse = await tutorsApi.getAll({ limit: 50 })
        const tutorsData = tutorsResponse.tutors || []
        
        setTutors(tutorsData)
        setFilteredTutors(tutorsData)
        
        // For now, we'll create mock availability data since the API doesn't provide it yet
        // In a real application, this would come from the backend
        const mockAvailability: Availability[] = tutorsData.map(tutor => ({
          tutorId: tutor.id,
          date: new Date().toISOString().split('T')[0],
          availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          bookedSlots: ['11:00'],
          blockedSlots: []
        }))
        
        setAvailability(mockAvailability)
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
    let filtered = tutors.filter(tutor => {
      const matchesSearch = tutor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           tutor.specializations.some(spec => spec.toLowerCase().includes(filters.search.toLowerCase()))
      
      const matchesSpecialization = !filters.specialization || 
                                   tutor.specializations.includes(filters.specialization)
      
      const matchesCity = !filters.city || tutor.location === filters.city
      
      const matchesPrice = !filters.priceRange || (() => {
        switch (filters.priceRange) {
          case 'under25': return tutor.hourly_rate < 25
          case '25-35': return tutor.hourly_rate >= 25 && tutor.hourly_rate <= 35
          case 'over35': return tutor.hourly_rate > 35
          default: return true
        }
      })()

      const matchesRating = !filters.rating || tutor.rating >= parseFloat(filters.rating)

      return matchesSearch && matchesSpecialization && matchesCity && matchesPrice && matchesRating
    })

    setFilteredTutors(filtered)
  }, [tutors, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      priceRange: '',
      city: '',
      availability: '',
      rating: ''
    })
  }

  const handleBookTutor = (tutor: Tutor) => {
    if (!user) {
      // Redirect to login page if user is not authenticated
      navigate('/login')
      return
    }
    
    setSelectedTutor(tutor)
    setBookingData({
      tutorId: tutor.id,
      date: '',
      time: '',
      duration: 60,
      subject: '',
      notes: ''
    })
    setShowBookingModal(true)
  }

  const getTutorAvailability = (tutorId: number, date: string) => {
    return availability.find(a => a.tutorId === tutorId && a.date === date)
  }

  const getAvailableSlots = (tutorId: number, date: string) => {
    const tutorAvailability = getTutorAvailability(tutorId, date)
    if (!tutorAvailability) return []
    
    return tutorAvailability.availableSlots.filter(slot => 
      !tutorAvailability.bookedSlots.includes(slot) && 
      !tutorAvailability.blockedSlots.includes(slot)
    )
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate required fields
      if (!selectedTutor?.id || !bookingData.date || !bookingData.time || !bookingData.subject) {
        toast({
          title: "Fehler",
          description: "Bitte füllen Sie alle erforderlichen Felder aus.",
          variant: "destructive"
        })
        return
      }

      // Format date to YYYY-MM-DD if it's not already in that format
      const formattedDate = bookingData.date.includes('T') 
        ? bookingData.date.split('T')[0] 
        : bookingData.date

      // Format time to ensure HH:MM format
      const formattedTime = bookingData.time.length === 5 
        ? bookingData.time 
        : `${bookingData.time.padStart(2, '0')}:00`

      const bookingPayload = {
        booking_type: 'tutor',
        tutor_id: selectedTutor.id,
        start_date: formattedDate,
        time_slot: formattedTime,
        duration_minutes: bookingData.duration,
        subject: bookingData.subject.trim(),
        notes: bookingData.notes?.trim() || ''
      }

      console.log('Sending booking payload:', bookingPayload) // Debug log

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(bookingPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData) // Debug log
        throw new Error(errorData.error || 'Fehler beim Erstellen der Buchung')
      }

      const result = await response.json()
      console.log('Booking result:', result) // Debug log

      // Show success toast
      toast({
        title: "Buchung erfolgreich!",
        description: `Ihr Unterricht mit ${selectedTutor.name} am ${formattedDate} um ${formattedTime} wurde bestätigt.`,
        variant: "default"
      })

      // Close modal and reset data
      setShowBookingModal(false)
      setSelectedTutor(null)
      setBookingData({
        tutorId: 0,
        date: '',
        time: '',
        duration: 60,
        subject: '',
        notes: ''
      })

    } catch (error) {
      console.error('Fehler beim Speichern der Buchung:', error)
      toast({
        title: "Fehler",
        description: "Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      })
    }
  }

  const cities = [...new Set(tutors.map(tutor => tutor.location))].concat(['Online'])
  const specializations = [...new Set(tutors.flatMap(tutor => tutor.specializations))]

  const calendarEvents = selectedTutor ? 
    availability
      .filter(a => a.tutorId === selectedTutor.id)
      .flatMap(a => 
        a.availableSlots
          .filter(slot => !a.bookedSlots.includes(slot) && !a.blockedSlots.includes(slot))
          .map(slot => ({
            title: 'Verfügbar',
            start: new Date(`${a.date}T${slot}:00`),
            end: new Date(`${a.date}T${slot}:00`),
            resource: { tutorId: a.tutorId, date: a.date, time: slot }
          }))
      ) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
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
                  className="text-sm text-blue-700 hover:text-blue-800"
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
                    placeholder="Tutor oder Spezialisierung..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Specialization */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spezialisierung
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Spezialisierungen</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preis pro Stunde
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Preise</option>
                  <option value="under25">Unter 25€</option>
                  <option value="25-35">25€ - 35€</option>
                  <option value="over35">Über 35€</option>
                </select>
              </div>

              {/* City */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standort
                </label>
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Standorte</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindestbewertung
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Bewertungen</option>
                  <option value="4.5">4.5+ Sterne</option>
                  <option value="4.0">4.0+ Sterne</option>
                  <option value="3.5">3.5+ Sterne</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredTutors.length} Tutoren gefunden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTutors.map(tutor => (
                <div key={tutor.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={tutor.avatar_url}
                        alt={tutor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tutor.name}
                          </h3>
                          {tutor.is_verified && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium text-gray-900">
                            {tutor.rating}
                          </span>
                          <span className="ml-1 text-sm text-gray-500">
                            ({tutor.review_count} Bewertungen)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{tutor.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{tutor.total_hours} Lektionen · {tutor.experience_years} Jahre Erfahrung</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{tutor.bio}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tutor.bio}
                    </p>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tutor.specializations.slice(0, 3).map((spec, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {spec}
                          </span>
                        ))}
                        {tutor.specializations.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{tutor.specializations.length - 3} mehr
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tutor.languages.slice(0, 2).map((lang, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Euro className="w-5 h-5 text-green-600 mr-1" />
                        <span className="text-2xl font-bold text-gray-900">
                          {tutor.hourly_rate}
                        </span>
                        <span className="text-gray-600 ml-1">/Stunde</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTutor(tutor)}
                          className="text-blue-700 hover:text-blue-800 px-3 py-1 border border-blue-700 rounded-md text-sm transition-colors"
                        >
                          Profil
                        </button>
                        <button
                          onClick={() => handleBookTutor(tutor)}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-md text-sm transition-colors"
                        >
                          Buchen
                        </button>
                        <ComparisonButton
                          item={{
                            id: tutor.id,
                            type: 'tutor',
                            data: tutor
                          }}
                          variant="icon"
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tutor Detail Modal */}
      {selectedTutor && !showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedTutor.avatar_url}
                    alt={selectedTutor.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTutor.name}
                      </h2>
                      {selectedTutor.is_verified && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{selectedTutor.rating}</span>
                      <span className="text-gray-500 ml-1">
                        ({selectedTutor.review_count} Bewertungen) · {selectedTutor.total_hours} Lektionen
                      </span>
                    </div>
                    <div className="flex items-center mt-1 text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{selectedTutor.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTutor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Über mich</h3>
                  <p className="text-gray-600 mb-6">{selectedTutor.bio}</p>

                  <h3 className="text-lg font-semibold mb-3">Verfügbarkeit diese Woche</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    {selectedTutor.availability && Object.keys(selectedTutor.availability).length > 0 ? (
                      Object.entries(selectedTutor.availability).map(([day, slots]) => (
                        <div key={day} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="capitalize font-medium">
                            {day === 'monday' ? 'Montag' :
                             day === 'tuesday' ? 'Dienstag' :
                             day === 'wednesday' ? 'Mittwoch' :
                             day === 'thursday' ? 'Donnerstag' :
                             day === 'friday' ? 'Freitag' :
                             day === 'saturday' ? 'Samstag' : 'Sonntag'}
                          </span>
                          <span className="text-gray-600">
                            {Array.isArray(slots) && slots.length > 0 ? `${slots[0]} - ${slots[slots.length - 1]}` : 'Nicht verfügbar'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Verfügbarkeit wird noch aktualisiert
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (!user) {
                          // Redirect to login page if user is not authenticated
                          navigate('/login')
                          return
                        }
                        
                        setShowBookingModal(true)
                        setBookingData({
                          tutorId: selectedTutor.id,
                          date: '',
                          time: '',
                          duration: 60,
                          subject: '',
                          notes: ''
                        })
                      }}
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-md transition-colors"
                    >
                      Jetzt buchen
                    </button>
                    <button className="flex-1 border border-blue-700 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-md transition-colors">
                      Nachricht senden
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Lektion buchen - {selectedTutor.name}
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum wählen
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingData.date}
                      onChange={(e) => {
                        const newDate = e.target.value
                        setBookingData({
                          ...bookingData,
                          date: newDate,
                          time: '' // Reset time when date changes
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Enhanced Time Selector */}
                {bookingData.date && (
                  <TutorTimeSelector
                    tutorId={selectedTutor.id}
                    selectedDate={bookingData.date}
                    selectedTime={bookingData.time}
                    onTimeChange={(time) => {
                      console.log('Selected time:', time) // Debug log
                      setBookingData({...bookingData, time})
                    }}
                    className="col-span-full"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dauer
                  </label>
                  <select
                    required
                    value={bookingData.duration}
                    onChange={(e) => setBookingData({...bookingData, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 Minuten</option>
                    <option value={60}>60 Minuten (Standard)</option>
                    <option value={90}>90 Minuten</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thema/Schwerpunkt
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Business Deutsch, Konversation, Grammatik"
                    value={bookingData.subject}
                    onChange={(e) => setBookingData({...bookingData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Besondere Wünsche (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Teilen Sie dem Tutor mit, worauf Sie sich konzentrieren möchten..."
                    value={bookingData.notes || ''}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gesamtpreis:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {Math.round((selectedTutor.hourly_rate * bookingData.duration) / 60)}€
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Basierend auf {bookingData.duration} Minuten zum Stundensatz von {selectedTutor.hourly_rate}€
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Jetzt buchen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
