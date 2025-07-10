import { useState } from 'react'
import { useToast } from '../hooks/use-toast'
import { 
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Upload,
  FileText,
  Award,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  BookOpen,
  Star,
  Camera,
  Link,
  Eye,
  EyeOff
} from 'lucide-react'

interface SchoolRegistrationData {
  // Grundinformationen
  schoolName: string
  foundedYear: string
  description: string
  website: string
  
  // Kontaktdaten
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  contactPerson: string
  
  // Rechtliche Informationen
  businessLicense: string
  taxId: string
  registrationNumber: string
  
  // Bildungsinformationen
  accreditations: string[]
  specializations: string[]
  languageLevels: string[]
  teachingMethods: string[]
  maxStudentsPerClass: number
  
  // Infrastruktur
  facilities: string[]
  equipments: string[]
  accessibility: string[]
  
  // Personal
  totalTeachers: number
  nativeGermanSpeakers: number
  qualifiedTeachers: number
  
  // Soziale Medien
  facebook: string
  instagram: string
  linkedin: string
  
  // Geschäftszeiten
  businessHours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  
  // Zahlungsinformationen
  bankName: string
  accountHolder: string
  iban: string
  
  // Uploads
  documents: File[]
  photos: File[]
  
  // Zustimmung
  termsAccepted: boolean
  privacyAccepted: boolean
  dataProcessingAccepted: boolean
}

const SchoolRegistrationPage = () => {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState<SchoolRegistrationData>({
    // Grundinformationen
    schoolName: '',
    foundedYear: '',
    description: '',
    website: '',
    
    // Kontaktdaten
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    contactPerson: '',
    
    // Rechtliche Informationen
    businessLicense: '',
    taxId: '',
    registrationNumber: '',
    
    // Bildungsinformationen
    accreditations: [],
    specializations: [],
    languageLevels: [],
    teachingMethods: [],
    maxStudentsPerClass: 15,
    
    // Infrastruktur
    facilities: [],
    equipments: [],
    accessibility: [],
    
    // Personal
    totalTeachers: 0,
    nativeGermanSpeakers: 0,
    qualifiedTeachers: 0,
    
    // Soziale Medien
    facebook: '',
    instagram: '',
    linkedin: '',
    
    // Geschäftszeiten
    businessHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '09:00-14:00',
      sunday: 'Geschlossen'
    },
    
    // Zahlungsinformationen
    bankName: '',
    accountHolder: '',
    iban: '',
    
    // Uploads
    documents: [],
    photos: [],
    
    // Zustimmung
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false
  })

  const steps = [
    {
      number: 1,
      title: 'Grundinformationen',
      description: 'Basisinformationen über Ihre Sprachschule',
      icon: Building
    },
    {
      number: 2,
      title: 'Kontakt & Standort',
      description: 'Kontaktdaten und Adressinformationen',
      icon: MapPin
    },
    {
      number: 3,
      title: 'Zertifizierungen & Qualifikationen',
      description: 'Akkreditierungen und Spezialisierungen',
      icon: Award
    },
    {
      number: 4,
      title: 'Infrastruktur & Personal',
      description: 'Ausstattung und Lehrpersonal',
      icon: Users
    },
    {
      number: 5,
      title: 'Dokumente & Uploads',
      description: 'Erforderliche Dokumente und Bilder',
      icon: FileText
    },
    {
      number: 6,
      title: 'Überprüfung & Bestätigung',
      description: 'Finale Überprüfung und Zustimmung',
      icon: CheckCircle
    }
  ]

  const accreditationOptions = [
    'TELC Prüfzentrum',
    'TestDaF Zentrum',
    'Goethe-Institut Partner',
    'BAMF zugelassen',
    'ISO 9001 zertifiziert',
    'Deutsche Botschaft anerkannt',
    'Europarat anerkannt',
    'IHK zertifiziert'
  ]

  const specializationOptions = [
    'Business Deutsch',
    'Medizinisches Deutsch',
    'Technisches Deutsch',
    'Prüfungsvorbereitung',
    'Konversationskurse',
    'Intensive Kurse',
    'Online-Unterricht',
    'Einzelunterricht',
    'Gruppenkurse',
    'Abendkurse',
    'Wochenendkurse',
    'Sommerkurse'
  ]

  const facilityOptions = [
    'Moderne Klassenzimmer',
    'Computer-Labor',
    'Sprachlabor',
    'Bibliothek',
    'WiFi im ganzen Gebäude',
    'Klimaanlage',
    'Cafeteria',
    'Parkplätze',
    'Behindertengerecht',
    'Interaktive Whiteboards',
    'Audio-/Video-Ausstattung',
    'Ruhezonen'
  ]

  const moroccanCities = [
    'Casablanca', 'Rabat', 'Fès', 'Marrakesch', 'Agadir', 'Tanger',
    'Meknès', 'Oujda', 'Kenitra', 'Tétouan', 'Temara', 'Safi',
    'Mohammedia', 'Khouribga', 'El Jadida', 'Béni Mellal', 'Nador',
    'Taza', 'Settat', 'Berrechid'
  ]

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }))
  }

  const toggleArrayValue = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev as any)[field].includes(value)
        ? (prev as any)[field].filter((item: string) => item !== value)
        : [...(prev as any)[field], value]
    }))
  }

  const handleFileUpload = (field: 'documents' | 'photos', files: FileList) => {
    const fileArray = Array.from(files)
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...fileArray]
    }))
  }

  const removeFile = (field: 'documents' | 'photos', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.schoolName && formData.description && formData.foundedYear)
      case 2:
        return !!(formData.address && formData.city && formData.phone && formData.email && formData.contactPerson)
      case 3:
        return formData.accreditations.length > 0 && formData.specializations.length > 0
      case 4:
        return formData.totalTeachers > 0 && formData.facilities.length > 0
      case 5:
        return formData.documents.length > 0
      case 6:
        return formData.termsAccepted && formData.privacyAccepted && formData.dataProcessingAccepted
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    } else {
      toast({
        title: "Unvollständige Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      toast({
        title: "Unvollständige Angaben",
        description: "Bitte akzeptieren Sie alle erforderlichen Bedingungen.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: "Registrierung erfolgreich!",
        description: "Ihre Anmeldung wurde eingereicht und wird innerhalb von 48 Stunden geprüft.",
        variant: "default"
      })
      
      // Reset form or redirect
      setCurrentStep(1)
      
    } catch (error) {
      toast({
        title: "Fehler bei der Registrierung",
        description: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grundinformationen</h2>
        <p className="text-gray-600">Erzählen Sie uns mehr über Ihre Sprachschule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schulname <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.schoolName}
            onChange={(e) => updateFormData('schoolName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Deutschzentrum Casablanca"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gründungsjahr <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1990"
            max="2025"
            value={formData.foundedYear}
            onChange={(e) => updateFormData('foundedYear', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="2015"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => updateFormData('website', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://ihre-schule.ma"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximale Klassengröße
          </label>
          <input
            type="number"
            min="5"
            max="30"
            value={formData.maxStudentsPerClass}
            onChange={(e) => updateFormData('maxStudentsPerClass', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="15"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beschreibung Ihrer Sprachschule <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Beschreiben Sie Ihre Sprachschule, Ihre Philosophie und was Sie besonders macht..."
          required
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MapPin className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kontakt & Standort</h2>
        <p className="text-gray-600">Ihre Kontaktdaten und Adressinformationen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ansprechpartner <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => updateFormData('contactPerson', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Maria Schmidt"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-Mail-Adresse <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="kontakt@ihre-schule.ma"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefonnummer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+212-5-XX-XX-XX-XX"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stadt <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Stadt auswählen</option>
            {moroccanCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vollständige Adresse <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Rue Ahmed Balafrej, Quartier des Hôpitaux"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahl</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => updateFormData('postalCode', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="20000"
          />
        </div>
      </div>

      {/* Soziale Medien */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Soziale Medien (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
            <input
              type="url"
              value={formData.facebook}
              onChange={(e) => updateFormData('facebook', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://facebook.com/ihre-schule"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
            <input
              type="url"
              value={formData.instagram}
              onChange={(e) => updateFormData('instagram', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://instagram.com/ihre-schule"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => updateFormData('linkedin', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="https://linkedin.com/company/ihre-schule"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Award className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zertifizierungen & Qualifikationen</h2>
        <p className="text-gray-600">Ihre Akkreditierungen und Spezialisierungen</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Akkreditierungen & Zertifizierungen <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accreditationOptions.map(option => (
            <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accreditations.includes(option)}
                onChange={() => toggleArrayValue('accreditations', option)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Kursarten & Spezialisierungen <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {specializationOptions.map(option => (
            <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.specializations.includes(option)}
                onChange={() => toggleArrayValue('specializations', option)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Angebotene Sprachniveaus</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
            <label key={level} className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.languageLevels.includes(level)}
                onChange={() => toggleArrayValue('languageLevels', level)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
              />
              <span className="text-sm font-medium text-gray-900">{level}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Geschäftslizenz-Nr.</label>
          <input
            type="text"
            value={formData.businessLicense}
            onChange={(e) => updateFormData('businessLicense', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="123456789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Steuer-ID</label>
          <input
            type="text"
            value={formData.taxId}
            onChange={(e) => updateFormData('taxId', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="12345678901234"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Registrierungsnummer</label>
          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) => updateFormData('registrationNumber', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="RC 123456"
          />
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Users className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Infrastruktur & Personal</h2>
        <p className="text-gray-600">Ausstattung und Lehrpersonal Ihrer Schule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gesamtanzahl Lehrer <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.totalTeachers}
            onChange={(e) => updateFormData('totalTeachers', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deutsche Muttersprachler</label>
          <input
            type="number"
            min="0"
            value={formData.nativeGermanSpeakers}
            onChange={(e) => updateFormData('nativeGermanSpeakers', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Qualifizierte Lehrer</label>
          <input
            type="number"
            min="0"
            value={formData.qualifiedTeachers}
            onChange={(e) => updateFormData('qualifiedTeachers', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="4"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Ausstattung & Einrichtungen <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {facilityOptions.map(option => (
            <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option)}
                onChange={() => toggleArrayValue('facilities', option)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Geschäftszeiten */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geschäftszeiten</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.businessHours).map(([day, time]) => (
            <div key={day} className="flex items-center space-x-4">
              <label className="w-20 text-sm font-medium text-gray-700 capitalize">
                {day === 'monday' ? 'Montag' :
                 day === 'tuesday' ? 'Dienstag' :
                 day === 'wednesday' ? 'Mittwoch' :
                 day === 'thursday' ? 'Donnerstag' :
                 day === 'friday' ? 'Freitag' :
                 day === 'saturday' ? 'Samstag' : 'Sonntag'}
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => updateNestedFormData('businessHours', day, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="09:00-18:00 oder Geschlossen"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Zahlungsinformationen */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zahlungsinformationen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bankname</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => updateFormData('bankName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Attijariwafa Bank"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kontoinhaber</label>
            <input
              type="text"
              value={formData.accountHolder}
              onChange={(e) => updateFormData('accountHolder', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Deutschzentrum Casablanca SARL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
            <input
              type="text"
              value={formData.iban}
              onChange={(e) => updateFormData('iban', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="MA XX XXXX XXXX XXXX XXXX XXXX XX"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dokumente & Uploads</h2>
        <p className="text-gray-600">Laden Sie die erforderlichen Dokumente und Bilder hoch</p>
      </div>

      <div className="space-y-8">
        {/* Dokumente Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Erforderliche Dokumente <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dokumente hochladen</h3>
            <p className="text-gray-600 mb-4">
              Geschäftslizenz, Zertifikate, Akkreditierungen (PDF, JPG, PNG - max. 10MB pro Datei)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files && handleFileUpload('documents', e.target.files)}
              className="hidden"
              id="documents-upload"
            />
            <label
              htmlFor="documents-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <Upload className="mr-2" size={20} />
              Dateien auswählen
            </label>
          </div>

          {/* Uploaded Documents */}
          {formData.documents.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Dokumente:</h4>
              <div className="space-y-2">
                {formData.documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2" size={20} />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile('documents', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fotos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Schulfotos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
            <Camera className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Schulfotos hochladen</h3>
            <p className="text-gray-600 mb-4">
              Bilder von Ihren Klassenzimmern, Einrichtungen und Außenbereichen (JPG, PNG - max. 5MB pro Datei)
            </p>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              onChange={(e) => e.target.files && handleFileUpload('photos', e.target.files)}
              className="hidden"
              id="photos-upload"
            />
            <label
              htmlFor="photos-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
            >
              <Camera className="mr-2" size={20} />
              Fotos auswählen
            </label>
          </div>

          {/* Uploaded Photos */}
          {formData.photos.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Fotos:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.photos.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Schulfoto ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile('photos', index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hinweise */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="text-blue-400 mr-3" size={20} />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Wichtige Hinweise:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Alle Dokumente werden vertraulich behandelt</li>
                <li>• Die Überprüfung dauert normalerweise 24-48 Stunden</li>
                <li>• Bei Fragen kontaktieren Sie uns unter support@smirisGermany.ma</li>
                <li>• Unvollständige Anträge verzögern den Genehmigungsprozess</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="mx-auto text-emerald-600 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Überprüfung & Bestätigung</h2>
        <p className="text-gray-600">Überprüfen Sie Ihre Angaben und bestätigen Sie die Registrierung</p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Schulinformationen</h3>
            <div className="mt-2 space-y-2">
              <p><span className="font-medium">Name:</span> {formData.schoolName}</p>
              <p><span className="font-medium">Stadt:</span> {formData.city}</p>
              <p><span className="font-medium">Kontakt:</span> {formData.contactPerson}</p>
              <p><span className="font-medium">E-Mail:</span> {formData.email}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Qualifikationen</h3>
            <div className="mt-2 space-y-2">
              <p><span className="font-medium">Akkreditierungen:</span> {formData.accreditations.length} ausgewählt</p>
              <p><span className="font-medium">Spezialisierungen:</span> {formData.specializations.length} ausgewählt</p>
              <p><span className="font-medium">Lehrer:</span> {formData.totalTeachers}</p>
              <p><span className="font-medium">Dokumente:</span> {formData.documents.length} hochgeladen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            checked={formData.termsAccepted}
            onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-900">
            Ich akzeptiere die{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 underline">
              Allgemeinen Geschäftsbedingungen
            </a>{' '}
            von SmirisGermany <span className="text-red-500">*</span>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="privacy"
            checked={formData.privacyAccepted}
            onChange={(e) => updateFormData('privacyAccepted', e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="privacy" className="ml-3 text-sm text-gray-900">
            Ich akzeptiere die{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 underline">
              Datenschutzerklärung
            </a>{' '}
            <span className="text-red-500">*</span>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="data-processing"
            checked={formData.dataProcessingAccepted}
            onChange={(e) => updateFormData('dataProcessingAccepted', e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="data-processing" className="ml-3 text-sm text-gray-900">
            Ich stimme der Verarbeitung meiner Daten zur Schulregistrierung zu{' '}
            <span className="text-red-500">*</span>
          </label>
        </div>
      </div>

      {/* Final Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircle className="text-emerald-400 mr-3" size={20} />
          <div>
            <h4 className="text-sm font-medium text-emerald-800">Nach der Registrierung:</h4>
            <ul className="text-sm text-emerald-700 mt-2 space-y-1">
              <li>• Sie erhalten eine Bestätigungs-E-Mail</li>
              <li>• Ihr Antrag wird innerhalb von 48 Stunden bearbeitet</li>
              <li>• Nach Genehmigung erhalten Sie Zugang zum School Dashboard</li>
              <li>• Sie können sofort mit dem Hinzufügen von Kursen beginnen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      default: return renderStep1()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sprachschule bei SmirisGermany registrieren
          </h1>
          <p className="text-lg text-gray-600">
            Werden Sie Partner und erreichen Sie mehr Deutschlernende in Marokko
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              const isValid = validateStep(step.number)
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' :
                    isActive ? 'bg-emerald-50 border-emerald-600 text-emerald-600' :
                    'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isActive ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      Schritt {step.number}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-24 h-0.5 mt-6 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft size={20} />
            <span>Zurück</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                validateStep(currentStep)
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Weiter</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!validateStep(6) || loading}
              className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
                validateStep(6) && !loading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Wird übermittelt...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Registrierung abschließen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchoolRegistrationPage
