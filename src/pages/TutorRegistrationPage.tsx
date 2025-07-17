import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/use-toast'
import { authApi, tutorsApi } from '../lib/api'
import { 
  User, Mail, Phone, MapPin, Award, BookOpen, Clock, 
  Upload, FileText, CheckCircle, ArrowRight, Star,
  Languages, GraduationCap, Camera, Globe
} from 'lucide-react'

interface TutorRegistrationData {
  // Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  password: string // <-- Add password field
  
  // Professional Info
  qualifications: string[]
  teachingExperience: number
  specializations: string[]
  languages: string[]
  hourlyRate: number
  
  // Teaching Details
  availableFormats: string[]
  maxStudentsPerGroup: number
  preparesForExams: string[]
  teachingPhilosophy: string
  
  // Agreements
  termsAccepted: boolean
  dataProcessingAccepted: boolean
}

interface TutorRegisterResponse {
  tutor: any;
  user: any;
  token?: string;
  temporaryPassword?: string;
}

export default function TutorRegistrationPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<TutorRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '', // <-- Initialize password
    qualifications: [],
    teachingExperience: 0,
    specializations: [],
    languages: [],
    hourlyRate: 150,
    availableFormats: [],
    maxStudentsPerGroup: 4,
    preparesForExams: [],
    teachingPhilosophy: '',
    termsAccepted: false,
    dataProcessingAccepted: false
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const steps = [
    { id: 1, title: 'Persönliche Daten', icon: User },
    { id: 2, title: 'Qualifikationen', icon: Award },
    { id: 3, title: 'Unterrichtsstil', icon: BookOpen },
    { id: 4, title: 'Prüfungsvorbereitung', icon: GraduationCap },
    { id: 5, title: 'Bestätigung', icon: CheckCircle }
  ]

  const qualificationOptions = [
    'Germanistik-Studium',
    'DaF-Zertifikat',
    'Goethe-Institut Zertifizierung',
    'BAMF-Zulassung',
    'TestDaF-Prüferqualifikation',
    'Muttersprachler Deutsch',
    'Lehramtsstudium',
    'Master in Linguistik'
  ]

  const specializationOptions = [
    'Allgemeines Deutsch',
    'Business Deutsch',
    'Konversationstraining',
    'Grammatik intensiv',
    'Aussprachetraining',
    'Deutsch für Mediziner',
    'Deutsch für Ingenieure',
    'Deutsch für IT-Berufe'
  ]

  const examPreparationOptions = [
    'A1 Zertifikat (Goethe)',
    'A2 Zertifikat (Goethe)',
    'B1 Zertifikat (Goethe/TELC)',
    'B2 Zertifikat (Goethe/TELC)',
    'C1 Zertifikat (Goethe/TELC)',
    'C2 Zertifikat (Goethe)',
    'TestDaF',
    'DSH (Deutsche Sprachprüfung)',
    'DTZ (Deutsch-Test für Zuwanderer)',
    'ÖSD Prüfungen'
  ]

  const formatOptions = [
    '1-zu-1 Einzelunterricht',
    'Kleingruppen (2-4 Personen)',
    'Größere Gruppen (5-8 Personen)',
    'Online-Unterricht',
    'Präsenz-Unterricht',
    'Hybrid (Online + Präsenz)'
  ]

  const handleInputChange = (field: keyof TutorRegistrationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: keyof TutorRegistrationData, item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), item]
        : (prev[field] as string[]).filter(i => i !== item)
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.termsAccepted || !formData.dataProcessingAccepted) {
      toast({
        title: "Fehler",
        description: "Bitte akzeptieren Sie die Bedingungen, um fortzufahren.",
        variant: "destructive"
      })
      return
    }
    if (!formData.password || formData.password.length < 6) {
      setPasswordError("Das Passwort muss mindestens 6 Zeichen lang sein.")
      return
    } else {
      setPasswordError(null)
    }
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        qualifications: JSON.stringify(formData.qualifications),
        specializations: JSON.stringify(formData.specializations),
        languages: JSON.stringify(formData.languages),
        availableFormats: JSON.stringify(formData.availableFormats),
        preparesForExams: JSON.stringify(formData.preparesForExams),
        termsAccepted: String(formData.termsAccepted),
        dataProcessingAccepted: String(formData.dataProcessingAccepted)
      }
      // Get the response from the backend
      const response: TutorRegisterResponse = await tutorsApi.registerTutor(payload);

      // Set token and user in localStorage and API client
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        authApi.setToken(response.token);
      }
      if (response.user) {
        localStorage.setItem('germansphere_user', JSON.stringify(response.user));
        // Optionally, update your AuthContext user here if you expose a setUser function
      }

      toast({
        title: "Anmeldung erfolgreich!",
        description: "Ihre Anmeldung wurde eingereicht. Sie erhalten innerhalb von 24h eine Bestätigung.",
      })

      navigate('/tutor-dashboard')
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Fehler bei der Anmeldung",
        description: "Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Persönliche Informationen</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vorname *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ihr Vorname"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nachname *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ihr Nachname"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail-Adresse *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="ihre.email@beispiel.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passwort *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Mindestens 6 Zeichen"
                minLength={6}
                required
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefonnummer *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stadt *</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Stadt auswählen</option>
                  <option value="Casablanca">Casablanca</option>
                  <option value="Rabat">Rabat</option>
                  <option value="Marrakech">Marrakech</option>
                  <option value="Fes">Fes</option>
                  <option value="Tangier">Tangier</option>
                  <option value="Agadir">Agadir</option>
                  <option value="Andere">Andere</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Qualifikationen & Erfahrung</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Ihre Qualifikationen *</label>
              <div className="grid md:grid-cols-2 gap-3">
                {qualificationOptions.map(qualification => (
                  <label key={qualification} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.qualifications.includes(qualification)}
                      onChange={(e) => handleArrayChange('qualifications', qualification, e.target.checked)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm">{qualification}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unterrichtserfahrung (Jahre) *</label>
              <select
                value={formData.teachingExperience}
                onChange={(e) => handleInputChange('teachingExperience', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={0}>Neu im Unterrichten</option>
                <option value={1}>1 Jahr</option>
                <option value={2}>2 Jahre</option>
                <option value={3}>3-5 Jahre</option>
                <option value={5}>5-10 Jahre</option>
                <option value={10}>Über 10 Jahre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Spezialisierungen *</label>
              <div className="grid md:grid-cols-2 gap-3">
                {specializationOptions.map(specialization => (
                  <label key={specialization} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(specialization)}
                      onChange={(e) => handleArrayChange('specializations', specialization, e.target.checked)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm">{specialization}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gewünschter Stundensatz (MAD) *</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="25"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                  className="flex-1"
                />
                <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold">
                  {formData.hourlyRate} MAD/h
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Empfohlener Bereich: 150-300 MAD/Stunde</p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Unterrichtsstil & Formate</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Verfügbare Unterrichtsformate *</label>
              <div className="space-y-3">
                {formatOptions.map(format => (
                  <label key={format} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availableFormats.includes(format)}
                      onChange={(e) => handleArrayChange('availableFormats', format, e.target.checked)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximale Gruppengröße (bei Gruppenunterricht)</label>
              <select
                value={formData.maxStudentsPerGroup}
                onChange={(e) => handleInputChange('maxStudentsPerGroup', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={2}>2 Personen</option>
                <option value={3}>3 Personen</option>
                <option value={4}>4 Personen</option>
                <option value={6}>6 Personen</option>
                <option value={8}>8 Personen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ihre Unterrichtsphilosophie *</label>
              <textarea
                value={formData.teachingPhilosophy}
                onChange={(e) => handleInputChange('teachingPhilosophy', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Beschreiben Sie Ihren Unterrichtsstil und Ihre Methoden (min. 100 Zeichen)"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.teachingPhilosophy.length}/500 Zeichen
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Prüfungsvorbereitung</h3>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-3">
                <GraduationCap className="text-emerald-600 mr-3" size={24} />
                <h4 className="text-lg font-semibold text-emerald-800">Prüfungsspezialist werden</h4>
              </div>
              <p className="text-emerald-700">
                Tutoren mit Prüfungsspezialisierung erhalten 30% höhere Buchungsraten und können Premium-Preise verlangen.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Für welche Deutschprüfungen können Sie vorbereiten? *
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {examPreparationOptions.map(exam => (
                  <label key={exam} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preparesForExams.includes(exam)}
                      onChange={(e) => handleArrayChange('preparesForExams', exam, e.target.checked)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-medium">{exam}</span>
                      {exam.includes('TestDaF') && (
                        <div className="text-xs text-blue-600 mt-1">🔥 Hohe Nachfrage</div>
                      )}
                      {exam.includes('B2') && (
                        <div className="text-xs text-purple-600 mt-1">⭐ Sehr beliebt</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {formData.preparesForExams.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3">Ihre Prüfungsspezialisierungen:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.preparesForExams.map(exam => (
                    <span key={exam} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {exam}
                    </span>
                  ))}
                </div>
                <p className="text-blue-700 text-sm mt-3">
                  💡 Tipp: Prüfungsspezialisten können 50-100 MAD mehr pro Stunde verlangen
                </p>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Bestätigung & Abschluss</h3>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h4 className="font-semibold text-emerald-800 mb-4">Zusammenfassung Ihrer Anmeldung:</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spezialisierungen:</span>
                  <span className="font-medium">{formData.specializations.length} ausgewählt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prüfungsvorbereitung:</span>
                  <span className="font-medium">{formData.preparesForExams.length} Prüfungstypen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stundensatz:</span>
                  <span className="font-medium">{formData.hourlyRate} MAD/h</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  Ich akzeptiere die <a href="#" className="text-emerald-600 hover:underline">Allgemeinen Geschäftsbedingungen</a> 
                  und die <a href="#" className="text-emerald-600 hover:underline">Tutor-Richtlinien</a> von SmirisGermany. *
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.dataProcessingAccepted}
                  onChange={(e) => handleInputChange('dataProcessingAccepted', e.target.checked)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  Ich stimme der Verarbeitung meiner Daten gemäß der 
                  <a href="#" className="text-emerald-600 hover:underline"> Datenschutzerklärung</a> zu. *
                </span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">Nächste Schritte:</h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
                <li>Überprüfung Ihrer Anmeldung durch unser Team (24-48h)</li>
                <li>E-Mail mit Bestätigung und Zugang zum Tutor-Dashboard</li>
                <li>Einrichtung Ihres Profils und Verfügbarkeitskalender</li>
                <li>Erste Buchungen erhalten</li>
              </ol>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tutor werden bei SmirisGermany
          </h1>
          <p className="text-xl text-gray-600">
            Teilen Sie Ihr Wissen und verdienen Sie als Premium Deutsch-Tutor
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${currentStep >= step.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  <step.icon size={20} />
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 md:w-24 h-1 mx-4 transition-all ${
                    currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all
              ${currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Zurück
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center"
            >
              Weiter
              <ArrowRight className="ml-2" size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!formData.termsAccepted || !formData.dataProcessingAccepted || isSubmitting}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all inline-flex items-center
                ${formData.termsAccepted && formData.dataProcessingAccepted && !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2">Absenden...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2" size={20} />
                  Anmeldung absenden
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
