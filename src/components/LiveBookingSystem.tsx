import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { 
  Calendar,
  Clock,
  Users,
  Euro,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Shield,
  Zap,
  Bell,
  User,
  BookOpen,
  Star,
  Award,
  ArrowRight,
  RefreshCw,
  Heart,
  X
} from 'lucide-react'

interface Course {
  id: number
  title: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  price: number
  originalPrice?: number
  duration: string
  maxStudents: number
  currentStudents: number
  availableSpots: number
  status: 'available' | 'almost_full' | 'full' | 'waitlist'
  startDate: string
  endDate: string
  schedule: string
  description: string
  instructor: string
  school: {
    id: number
    name: string
    rating: number
    address: string
    phone: string
    email: string
  }
  features: string[]
  includes: string[]
  requirements: string[]
  image: string
  lastBooked: string
  popularity: 'hot' | 'popular' | 'new' | null
  discount?: {
    percentage: number
    validUntil: string
    reason: string
  }
}

interface BookingData {
  courseId: number
  studentName: string
  studentEmail: string
  studentPhone: string
  comments: string
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer'
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  marketingConsent: boolean
  newsletterConsent: boolean
}

interface LiveBookingSystemProps {
  course: Course
  onBookingComplete?: (bookingId: string) => void
  onClose?: () => void
}

const LiveBookingSystem = ({ course, onBookingComplete, onClose }: LiveBookingSystemProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    availableSpots: course.availableSpots,
    currentStudents: course.currentStudents,
    lastBooking: course.lastBooked,
    viewingNow: Math.floor(Math.random() * 8) + 3 // 3-10 people viewing
  })
  
  const [bookingData, setBookingData] = useState<BookingData>({
    courseId: course.id,
    studentName: user?.name || '',
    studentEmail: user?.email || '',
    studentPhone: '',
    comments: '',
    paymentMethod: 'stripe',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    marketingConsent: false,
    newsletterConsent: true
  })

  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [showUrgency, setShowUrgency] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate someone booking (small chance)
      if (Math.random() < 0.1 && realTimeData.availableSpots > 0) {
        setRealTimeData(prev => ({
          ...prev,
          availableSpots: prev.availableSpots - 1,
          currentStudents: prev.currentStudents + 1,
          lastBooking: new Date().toISOString()
        }))
        
        toast({
          title: "Jemand anderes hat gerade gebucht!",
          description: `Nur noch ${realTimeData.availableSpots - 1} Plätze verfügbar`,
          variant: "default"
        })
      }
      
      // Update viewing count
      setRealTimeData(prev => ({
        ...prev,
        viewingNow: Math.floor(Math.random() * 8) + 3
      }))
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [realTimeData.availableSpots])

  // Countdown timer
  useEffect(() => {
    if (step > 1) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 300) { // 5 minutes left
            setShowUrgency(true)
          }
          if (prev <= 0) {
            setStep(1)
            toast({
              title: "Zeitüberschreitung",
              description: "Ihre Buchung wurde aufgrund von Inaktivität zurückgesetzt",
              variant: "destructive"
            })
            return 15 * 60
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const updateBookingData = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedData = (parent: string, field: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }))
  }

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return true
      case 2:
        return !!(bookingData.studentName && bookingData.studentEmail && bookingData.studentPhone)
      case 3:
        return !!(bookingData.emergencyContact.name && bookingData.emergencyContact.phone)
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    } else {
      toast({
        title: "Unvollständige Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleBooking = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const bookingId = `BK${Date.now()}`
      
      toast({
        title: "Buchung erfolgreich!",
        description: `Ihre Buchung ${bookingId} wurde bestätigt. Sie erhalten eine E-Mail-Bestätigung.`,
        variant: "default"
      })
      
      onBookingComplete?.(bookingId)
      
    } catch (error) {
      toast({
        title: "Buchungsfehler",
        description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Course Overview */}
      <div className="relative overflow-hidden rounded-xl">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/course-default.jpg'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold">{course.title}</h3>
          <p className="text-sm opacity-90">{course.school.name}</p>
        </div>
        {course.popularity && (
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              course.popularity === 'hot' ? 'bg-red-500 text-white' :
              course.popularity === 'popular' ? 'bg-orange-500 text-white' :
              'bg-emerald-500 text-white'
            }`}>
              {course.popularity === 'hot' ? '🔥 Sehr beliebt' :
               course.popularity === 'popular' ? '⭐ Beliebt' : '✨ Neu'}
            </span>
          </div>
        )}
      </div>

      {/* Real-time Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-800">Live-Verfügbarkeit</span>
          </div>
          <span className="text-xs text-emerald-600">zuletzt aktualisiert: vor 2 Min.</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{realTimeData.availableSpots}</div>
            <div className="text-sm text-emerald-700">Verfügbare Plätze</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{realTimeData.viewingNow}</div>
            <div className="text-sm text-blue-700">Schauen gerade</div>
          </div>
        </div>
        
        {realTimeData.availableSpots <= 3 && (
          <div className="mt-3 flex items-center space-x-2 text-orange-600">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Nur noch wenige Plätze verfügbar!</span>
          </div>
        )}
      </div>

      {/* Course Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Calendar className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Kursdauer</div>
              <div className="text-sm text-gray-600">{course.duration}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Stundenplan</div>
              <div className="text-sm text-gray-600">{course.schedule}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <BookOpen className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Sprachniveau</div>
              <div className="text-sm text-gray-600">{course.level}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Users className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Klassengröße</div>
              <div className="text-sm text-gray-600">Max. {course.maxStudents} Teilnehmer</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Kursleiter</div>
              <div className="text-sm text-gray-600">{course.instructor}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Star className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Schulbewertung</div>
              <div className="text-sm text-gray-600">{course.school.rating}/5 ⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Kurspreis</div>
            <div className="flex items-center space-x-2">
              {course.originalPrice && (
                <span className="text-lg text-gray-400 line-through">{course.originalPrice} MAD</span>
              )}
              <span className="text-3xl font-bold text-emerald-600">{course.price} MAD</span>
            </div>
            {course.discount && (
              <div className="text-sm text-emerald-600 font-medium">
                {course.discount.percentage}% Rabatt - {course.discount.reason}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Zahlung möglich per</div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="bg-blue-100 p-1 rounded text-xs font-medium text-blue-800">Karte</div>
              <div className="bg-yellow-100 p-1 rounded text-xs font-medium text-yellow-800">PayPal</div>
              <div className="bg-gray-100 p-1 rounded text-xs font-medium text-gray-800">Bank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={nextStep}
        disabled={realTimeData.availableSpots === 0}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
          realTimeData.availableSpots === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {realTimeData.availableSpots === 0 ? (
          <>
            <Users className="inline mr-2" size={20} />
            Kurs ausgebucht - Warteliste
          </>
        ) : (
          <>
            <Zap className="inline mr-2" size={20} />
            Jetzt buchen ({realTimeData.availableSpots} Plätze frei)
          </>
        )}
      </button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Persönliche Daten</h3>
        <p className="text-gray-600">Ihre Kontaktinformationen für die Kursanmeldung</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vollständiger Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={bookingData.studentName}
            onChange={(e) => updateBookingData('studentName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Ahmed Hassan"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-Mail-Adresse <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={bookingData.studentEmail}
            onChange={(e) => updateBookingData('studentEmail', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="ahmed@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefonnummer <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={bookingData.studentPhone}
            onChange={(e) => updateBookingData('studentPhone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="+212-6-XX-XX-XX-XX"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Besondere Wünsche oder Fragen (Optional)
          </label>
          <textarea
            value={bookingData.comments}
            onChange={(e) => updateBookingData('comments', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Teilen Sie uns mit, wenn Sie spezielle Anforderungen haben..."
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Notfallkontakt</h3>
        <p className="text-gray-600">Für den Fall, dass wir Sie nicht erreichen können</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name der Kontaktperson <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={bookingData.emergencyContact.name}
            onChange={(e) => updateNestedData('emergencyContact', 'name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Fatima Hassan"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefonnummer <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={bookingData.emergencyContact.phone}
            onChange={(e) => updateNestedData('emergencyContact', 'phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="+212-6-XX-XX-XX-XX"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beziehung zu Ihnen
          </label>
          <select
            value={bookingData.emergencyContact.relationship}
            onChange={(e) => updateNestedData('emergencyContact', 'relationship', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Bitte auswählen</option>
            <option value="Ehepartner/in">Ehepartner/in</option>
            <option value="Elternteil">Elternteil</option>
            <option value="Geschwister">Geschwister</option>
            <option value="Kind">Kind</option>
            <option value="Freund/in">Freund/in</option>
            <option value="Andere">Andere</option>
          </select>
        </div>
      </div>

      {/* Data consent */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="marketing"
            checked={bookingData.marketingConsent}
            onChange={(e) => updateBookingData('marketingConsent', e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="marketing" className="text-sm text-gray-700">
            Ich möchte über neue Kurse und Angebote von SmirisGermany informiert werden
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="newsletter"
            checked={bookingData.newsletterConsent}
            onChange={(e) => updateBookingData('newsletterConsent', e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="newsletter" className="text-sm text-gray-700">
            Newsletter mit Lerntipps und Deutsch-Ressourcen abonnieren
          </label>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Zahlungsart wählen</h3>
        <p className="text-gray-600">Sichere Zahlung mit SSL-Verschlüsselung</p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="stripe"
            checked={bookingData.paymentMethod === 'stripe'}
            onChange={(e) => updateBookingData('paymentMethod', e.target.value)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <div className="ml-3 flex items-center space-x-3">
            <CreditCard className="text-emerald-600" size={20} />
            <div>
              <div className="font-medium">Kreditkarte / Debitkarte</div>
              <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
            </div>
          </div>
        </label>

        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="paypal"
            checked={bookingData.paymentMethod === 'paypal'}
            onChange={(e) => updateBookingData('paymentMethod', e.target.value)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <div className="ml-3 flex items-center space-x-3">
            <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
            <div>
              <div className="font-medium">PayPal</div>
              <div className="text-sm text-gray-500">Sichere Zahlung über PayPal</div>
            </div>
          </div>
        </label>

        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="bank_transfer"
            checked={bookingData.paymentMethod === 'bank_transfer'}
            onChange={(e) => updateBookingData('paymentMethod', e.target.value)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <div className="ml-3 flex items-center space-x-3">
            <div className="w-5 h-5 bg-gray-600 rounded text-white text-xs flex items-center justify-center font-bold">B</div>
            <div>
              <div className="font-medium">Banküberweisung</div>
              <div className="text-sm text-gray-500">Traditionelle Überweisung (2-3 Werktage)</div>
            </div>
          </div>
        </label>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Buchungsübersicht</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Kurs</span>
            <span className="font-medium">{course.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Niveau</span>
            <span className="font-medium">{course.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dauer</span>
            <span className="font-medium">{course.duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Beginn</span>
            <span className="font-medium">{new Date(course.startDate).toLocaleDateString('de-DE')}</span>
          </div>
          {course.discount && (
            <div className="flex justify-between text-emerald-600">
              <span>Rabatt ({course.discount.percentage}%)</span>
              <span>-{((course.originalPrice || course.price) - course.price)} MAD</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg">
            <span>Gesamtpreis</span>
            <span className="text-emerald-600">{course.price} MAD</span>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-800">
          <Shield size={20} />
          <div className="text-sm">
            <div className="font-medium">Sichere Zahlung</div>
            <div>256-Bit SSL-Verschlüsselung • Keine Speicherung Ihrer Kartendaten</div>
          </div>
        </div>
      </div>

      {/* Final Booking Button */}
      <button
        onClick={handleBooking}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="animate-spin" size={20} />
            <span>Wird verarbeitet...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle size={20} />
            <span>Buchung abschließen - {course.price} MAD</span>
          </div>
        )}
      </button>
    </div>
  )

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Live-Buchung</h2>
              <p className="text-sm text-gray-600">
                Schritt {step} von 4
                {step > 1 && (
                  <span className="ml-4 text-orange-600 font-medium">
                    Zeit verbleibend: {formatTime(timeLeft)}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Urgency Banner */}
          {showUrgency && step > 1 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-600">
                <Bell size={16} />
                <span className="text-sm font-medium">
                  Nur noch {formatTime(timeLeft)} Zeit! Schließen Sie Ihre Buchung ab.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        {step > 1 && step < 4 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>Zurück</span>
              </button>
              
              <button
                onClick={nextStep}
                disabled={!validateStep(step)}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                  validateStep(step)
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Weiter</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveBookingSystem
