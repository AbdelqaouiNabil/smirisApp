import  { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { PaymentIntegration } from '../components/payment/PaymentIntegration'
import { Calendar, Clock, MapPin, Users, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { coursesApi, bookingsApi, Course, ApiError } from '../lib/api'
import { useToast } from '../hooks/use-toast'

interface BookingItem {
  id: string
  type: 'course' | 'tutor' | 'visa'
  title: string
  description: string
  price: number
  currency: string
  duration?: string
  location?: string
  rating?: number
  provider?: string
  image?: string
  features?: string[]
}

interface BookingFormData {
  studentName: string
  email: string
  phone: string
  startDate: string
  timeSlot: string
  notes: string
  participants: number
}

export default function BookingPage() {
  const { id, type } = useParams<{ id: string; type: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [bookingItem, setBookingItem] = useState<BookingItem | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [bookingData, setBookingData] = useState<BookingFormData>({
    studentName: user?.name || '',
    email: user?.email || '',
    phone: '',
    startDate: '',
    timeSlot: '',
    notes: '',
    participants: 1
  })
  const [isLoading, setIsLoading] = useState(true)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempBookingId, setTempBookingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadBookingItem()
  }, [id, type, isAuthenticated, navigate])

  const loadBookingItem = async () => {
    setIsLoading(true)
    try {
      if (type === 'course' && id) {
        // Load real course data from API
        const courseResponse = await coursesApi.getById(parseInt(id))
        const courseData = courseResponse.course
        
        setCourse(courseData)
        
        // Create booking item from course data
        const bookingItemData: BookingItem = {
          id: courseData.id.toString(),
          type: 'course',
          title: courseData.title,
          description: courseData.description || '',
          price: courseData.price,
          currency: courseData.currency,
          duration: courseData.duration_weeks ? `${courseData.duration_weeks} Wochen` : 'N/A',
          location: courseData.school_location || courseData.tutor_name || 'Online',
          rating: courseData.school_rating || courseData.tutor_rating || 0,
          provider: courseData.school_name || courseData.tutor_name || 'Unbekannt',
          image: courseData.image_url || '/images/course-default.jpg',
          features: [
            `Sprachniveau: ${courseData.level}`,
            `Kategorie: ${courseData.category}`,
            courseData.is_online ? 'Online verfügbar' : 'Vor Ort',
            courseData.schedule ? `Zeitplan: ${courseData.schedule}` : 'Flexible Termine'
          ]
        }
        
        setBookingItem(bookingItemData)
      } else {
        // For other types (tutor, visa), use mock data for now
        const mockData: BookingItem = {
          id: id || '1',
          type: type as 'course' | 'tutor' | 'visa',
          title: getTitle(type, id),
          description: getDescription(type),
          price: getPrice(type),
          currency: 'MAD',
          duration: getDuration(type),
          location: 'Casablanca, Marokko',
          rating: 4.8,
          provider: getProvider(type),
          image: getImage(type),
          features: getFeatures(type)
        }
        
        setBookingItem(mockData)
      }
    } catch (error) {
      console.error('Error loading booking item:', error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Buchungsdetails.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = (type: string | undefined, id: string | undefined) => {
    switch (type) {
      case 'course':
        return 'Intensiv Deutsch B2 Kurs'
      case 'tutor':
        return 'Privatunterricht mit Maria Schmidt'
      case 'visa':
        return 'Visa-Beratung & Dokumentenhilfe'
      default:
        return 'Buchung'
    }
  }

  const getDescription = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return 'Intensiver B2-Deutschkurs mit zertifizierten Lehrern. 20 Stunden pro Woche, kleine Gruppen, TestDaF-Vorbereitung inklusive.'
      case 'tutor':
        return 'Personalisierte Deutschstunden mit erfahrener Tutorin. Flexibel Terminplanung, individuelle Lernziele, Prüfungsvorbereitung.'
      case 'visa':
        return 'Komplette Unterstützung bei der Visa-Beantragung für Deutschland. Dokumentenübersetzung, Formularausfüllung, Terminvereinbarung.'
      default:
        return ''
    }
  }

  const getPrice = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return 2500
      case 'tutor':
        return 250
      case 'visa':
        return 1500
      default:
        return 500
    }
  }

  const getDuration = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return '4 Wochen (80 Stunden)'
      case 'tutor':
        return '1 Stunde'
      case 'visa':
        return 'Komplettservice'
      default:
        return ''
    }
  }

  const getProvider = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return 'Deutsche Sprachschule Casablanca'
      case 'tutor':
        return 'Maria Schmidt (Zertifiziert)'
      case 'visa':
        return 'Visa-Experten Marokko'
      default:
        return ''
    }
  }

  const getImage = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return '/images/course-b2.jpg'
      case 'tutor':
        return '/images/tutor-maria.webp'
      case 'visa':
        return '/images/visa-services.jpg'
      default:
        return '/images/hero-bg.jpg'
    }
  }

  const getFeatures = (type: string | undefined) => {
    switch (type) {
      case 'course':
        return ['Kleine Gruppen (max. 8 Personen)', 'TestDaF-Vorbereitung', 'Zertifikat inklusive', 'Flexible Termine']
      case 'tutor':
        return ['Individuelle Betreuung', 'Flexibel Termine', 'Online oder vor Ort', 'Prüfungsvorbereitung']
      case 'visa':
        return ['Dokumentenübersetzung', 'Formularausfüllung', 'Terminvereinbarung', 'Begleitung zum Konsulat']
      default:
        return []
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    })
  }

  const handleBooking = async () => {
    // Validate form
    if (!bookingData.studentName || !bookingData.email || !bookingData.startDate) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      })
      return
    }
    
    if (type === 'course' && course) {
      setIsSubmitting(true)
      try {
        // Create booking directly (skip payment)
        const bookingPayload = {
          booking_type: 'course',
          course_id: course.id,
          start_date: bookingData.startDate,
          time_slot: bookingData.timeSlot ? bookingData.timeSlot.split('-')[0].trim() : '09:00',
          duration_minutes: 60, // Default duration for courses
          subject: `Kurs: ${course.title}`,
          notes: bookingData.notes || ''
        }

        console.log('Creating booking (no payment):', bookingPayload)
        const bookingResponse = await bookingsApi.create(bookingPayload)
        setTempBookingId(bookingResponse.booking.id)
        setPaymentResult({
          paymentId: bookingResponse.booking.id,
          transactionId: 'N/A',
          status: 'Erfolgreich (ohne Zahlung)'
        })
      } catch (error) {
        console.error('Error creating booking:', error)
        toast({
          title: "Buchungsfehler",
          description: error instanceof ApiError ? error.message : "Fehler beim Erstellen der Buchung.",
          variant: "destructive"
        })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // For other types, just show success (or handle as needed)
      setPaymentResult({
        paymentId: 'N/A',
        transactionId: 'N/A',
        status: 'Erfolgreich (ohne Zahlung)'
      })
    }
  }

  const handlePaymentSuccess = async (payment: any) => {
    setIsSubmitting(true)
    try {
      if (type === 'course' && course && tempBookingId) {
        // Update the existing booking with payment information
        console.log('Payment successful for booking:', tempBookingId)
        
        toast({
          title: "Buchung erfolgreich!",
          description: "Ihre Kursbuchung wurde erfolgreich erstellt und bezahlt.",
          variant: "default"
        })
        
        setPaymentResult({
          ...payment,
          bookingId: tempBookingId
        })
      } else {
        // For other types, just log for now
        console.log('Booking successful:', { bookingData, payment })
        setPaymentResult(payment)
      }
    } catch (error) {
      console.error('Error processing payment success:', error)
      toast({
        title: "Buchungsfehler",
        description: error instanceof ApiError ? error.message : "Fehler beim Verarbeiten der Zahlung.",
        variant: "destructive"
      })
      setShowPayment(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Zahlungsfehler",
      description: error,
      variant: "destructive"
    })
    setShowPayment(false)
  }

  const calculateTotal = () => {
    if (!bookingItem) return 0
    let total = bookingItem.price
    
    if (bookingItem.type === 'tutor' && bookingData.participants > 1) {
      total *= bookingData.participants
    }
    
    return total
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buchungsdetails werden geladen...</p>
        </div>
      </div>
    )
  }

  if (!bookingItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Buchungsitem nicht gefunden</h2>
          <Button onClick={() => navigate('/')}>Zur Startseite</Button>
        </div>
      </div>
    )
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Buchung erfolgreich!</CardTitle>
            <CardDescription>
              Ihre Zahlung wurde erfolgreich verarbeitet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Buchungsdetails:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Buchungs-ID:</strong> {paymentResult.paymentId}</p>
                <p><strong>Transaktions-ID:</strong> {paymentResult.transactionId}</p>
                <p><strong>Betrag:</strong> {bookingItem.price} {bookingItem.currency}</p>
                <p><strong>Status:</strong> {paymentResult.status}</p>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Sie erhalten eine Bestätigungs-E-Mail mit allen Details.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showPayment) {
    // Payment form is now deactivated/skipped
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Buchung abschließen</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Item Details */}
          <Card>
            <CardHeader>
              <CardTitle>{bookingItem.title}</CardTitle>
              <CardDescription>{bookingItem.provider}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg bg-gray-200 overflow-hidden">
                <img
                  src={bookingItem.image}
                  alt={bookingItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/hero-bg.jpg'
                  }}
                />
              </div>
              
              <p className="text-gray-600">{bookingItem.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{bookingItem.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{bookingItem.location}</span>
                </div>
                {bookingItem.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{bookingItem.rating} / 5.0</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{bookingData.participants} Teilnehmer</span>
                </div>
              </div>
              
              {bookingItem.features && (
                <div>
                  <h4 className="font-medium mb-2">Inklusive:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {bookingItem.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Buchungsdetails</CardTitle>
              <CardDescription>
                Bitte geben Sie Ihre Buchungsinformationen ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">Name *</Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    value={bookingData.studentName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={bookingData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={bookingData.phone}
                  onChange={handleInputChange}
                  placeholder="+212 6XX XXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={bookingData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="timeSlot">Uhrzeit</Label>
                  <Select value={bookingData.timeSlot} onValueChange={(value) => setBookingData({...bookingData, timeSlot: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Uhrzeit wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00-11:00">09:00 - 11:00</SelectItem>
                      <SelectItem value="11:00-13:00">11:00 - 13:00</SelectItem>
                      <SelectItem value="14:00-16:00">14:00 - 16:00</SelectItem>
                      <SelectItem value="16:00-18:00">16:00 - 18:00</SelectItem>
                      <SelectItem value="18:00-20:00">18:00 - 20:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {bookingItem.type === 'tutor' && (
                <div>
                  <Label htmlFor="participants">Anzahl Teilnehmer</Label>
                  <Select 
                    value={bookingData.participants.toString()} 
                    onValueChange={(value) => setBookingData({...bookingData, participants: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Person</SelectItem>
                      <SelectItem value="2">2 Personen</SelectItem>
                      <SelectItem value="3">3 Personen</SelectItem>
                      <SelectItem value="4">4 Personen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Besondere Wünsche</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Besondere Anforderungen oder Wünsche..."
                />
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Gesamtpreis:</span>
                  <span className="text-blue-600">
                    {calculateTotal()} {bookingItem.currency}
                  </span>
                </div>
                {bookingItem.type === 'tutor' && bookingData.participants > 1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {bookingItem.price} {bookingItem.currency} × {bookingData.participants} Personen
                  </p>
                )}
              </div>

              <Button 
                onClick={handleBooking} 
                disabled={isSubmitting}
                className="w-full" 
                size="lg"
              >
                {isSubmitting ? 'Wird verarbeitet...' : `Zur Zahlung - ${calculateTotal()} ${bookingItem.currency}`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Mit der Buchung akzeptieren Sie unsere AGB und Stornierungsbedingungen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
