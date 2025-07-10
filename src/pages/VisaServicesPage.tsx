import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Euro, Clock, Star, CheckCircle, MessageCircle, FileText, GraduationCap, Briefcase, Users, Zap, Shield, Heart } from 'lucide-react'
import { visaApi, VisaService } from '../lib/api'

// Extended interface for frontend-specific properties
interface ExtendedVisaService extends VisaService {
  category?: string
  duration?: string
  processTime?: string
  icon?: string
  popular?: boolean
}

const iconMap = {
  MessageCircle,
  FileText,
  GraduationCap,
  Briefcase,
  Users,
  Zap,
  Shield,
  Heart
}

export default function VisaServicesPage() {
  const { t } = useTranslation('visa')
  const [services, setServices] = useState<VisaService[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedService, setSelectedService] = useState<VisaService | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await visaApi.getAll()
        setServices(response.services || [])
      } catch (error) {
        console.error('Error loading visa services:', error)
      }
    }

    loadServices()
  }, [])

  const categories = [...new Set(services.map(service => service.category))]
  
  const filteredServices = services.filter(service =>
    !selectedCategory || service.category === selectedCategory
  )

  const handleBookService = (service: VisaService) => {
    setSelectedService(service)
    setShowBookingForm(true)
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate booking submission
    alert(`Buchungsanfrage für "${selectedService?.name}" wurde gesendet! Wir melden uns innerhalb von 24 Stunden bei Ihnen.`)
    setShowBookingForm(false)
    setSelectedService(null)
    setBookingData({ name: '', email: '', phone: '', message: '' })
  }

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
        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services nach Kategorie</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle Services
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap]
            
            return (
              <div
                key={service.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                  service.popular ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                {service.popular && (
                  <div className="bg-blue-700 text-white text-center py-1 text-sm font-medium">
                    Beliebt
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {IconComponent && (
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <IconComponent className="w-6 h-6 text-blue-700" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <span className="text-sm text-gray-500">{service.category}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{service.processTime}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Euro className="w-4 h-4 mr-2" />
                      <span>{service.duration}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Inkludiert:</h4>
                    <ul className="space-y-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{service.features.length - 3} weitere Leistungen
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {service.price}MAD
                      </span>
                    </div>
                    <button
                      onClick={() => handleBookService(service)}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Jetzt buchen
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Services gefunden
            </h3>
            <p className="text-gray-600">
              Versuchen Sie es mit einer anderen Kategorie
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('features.title', 'Pourquoi nos services de visa?')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erfahrene Experten
              </h3>
              <p className="text-gray-600">
                Über 10 Jahre Erfahrung in der Visa-Beratung und -Bearbeitung
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                98% Erfolgsrate
              </h3>
              <p className="text-gray-600">
                Fast alle unsere Kunden erhalten erfolgreich ihr Deutschland-Visa
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Schnelle Bearbeitung
              </h3>
              <p className="text-gray-600">
                Optimierte Prozesse für die schnellstmögliche Bearbeitung
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Service buchen
                </h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">Preis:</span>
                  <span className="text-lg font-bold text-blue-700">{selectedService.price}MAD</span>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vollständiger Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingData.name}
                    onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingData.email}
                    onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zusätzliche Informationen (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Besondere Wünsche oder Fragen..."
                  ></textarea>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
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
