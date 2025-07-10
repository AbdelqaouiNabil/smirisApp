import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, StudentRegistrationData } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { Mail, User, Phone, Clock, GraduationCap, Euro, Star, MapPin, BookOpen, FileText, DollarSign, CheckCircle } from 'lucide-react'

const StudentRegistrationPage = () => {
  const { t } = useTranslation(['common', 'registration'])
  const { registerStudent, isLoading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<StudentRegistrationData>({
    email: '',
    familyName: '',
    firstName: '',
    city: '',
    whatsappNumber: '+212',
    bestCallTime: '',
    educationLevel: '',
    baccalaureatGrade: '',
    interestedOffer: '',
    studyBudget: '',
    howFoundUs: '',
    studyFinancing: '',
    currentLanguageLevel: '',
    password: ''
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tangier', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan', 'Salé']
  
  const educationLevels = [
    'بكالوريا (Baccalauréat)',
    'بكالوريا + 2 (Bac+2)',
    'إجازة (Licence/Bac+3)',
    'ماستر (Master/Bac+5)',
    'دكتوراه (Doctorat)',
    'دبلوم مهني (Diplôme professionnel)',
    'أخرى (Autre)'
  ]

  const budgetRanges = [
    'أقل من 50,000 درهم (Moins de 50.000 MAD)',
    '50,000 - 100,000 درهم (50.000 - 100.000 MAD)',
    '100,000 - 200,000 درهم (100.000 - 200.000 MAD)',
    '200,000 - 300,000 درهم (200.000 - 300.000 MAD)',
    'أكثر من 300,000 درهم (Plus de 300.000 MAD)'
  ]

  const languageLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'مبتدئ تماما (Débutant complet)']

  const offers = [
    'دورات اللغة الألمانية (Cours d\'allemand)',
    'الدراسة في ألمانيا (Études en Allemagne)',
    'خدمات التأشيرة (Services de visa)',
    'التدريب المهني (Formation professionnelle)',
    'برامج التبادل (Programmes d\'échange)'
  ]

  const financingSources = [
    'المدخرات الشخصية (Épargne personnelle)',
    'دعم العائلة (Soutien familial)',
    'منحة دراسية (Bourse d\'études)',
    'قرض بنكي (Prêt bancaire)',
    'عمل بدوام جزئي (Travail à temps partiel)',
    'أخرى (Autre)'
  ]

  const discoverySources = [
    'فيسبوك (Facebook)',
    'إنستغرام (Instagram)',
    'جوجل (Google)',
    'أصدقاء (Amis)',
    'موقع إلكتروني (Site web)',
    'إعلان (Publicité)',
    'أخرى (Autre)'
  ]

  const callTimes = [
    'الصباح (8:00 - 12:00) - Matin',
    'بعد الظهر (12:00 - 17:00) - Après-midi',
    'المساء (17:00 - 21:00) - Soir',
    'في أي وقت - N\'importe quand'
  ]

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.email) newErrors.email = 'البريد الإلكتروني مطلوب'
      if (!formData.familyName) newErrors.familyName = 'الاسم العائلي مطلوب'
      if (!formData.firstName) newErrors.firstName = 'الاسم الشخصي مطلوب'
      if (!formData.city) newErrors.city = 'المدينة مطلوبة'
      if (!formData.password || formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      if (formData.password !== confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة'
    }

    if (stepNumber === 2) {
      if (!formData.whatsappNumber || formData.whatsappNumber === '+212') newErrors.whatsappNumber = 'رقم الواتساب مطلوب'
      if (!formData.bestCallTime) newErrors.bestCallTime = 'وقت الاتصال مطلوب'
      if (!formData.educationLevel) newErrors.educationLevel = 'المستوى الدراسي مطلوب'
      if (!formData.baccalaureatGrade) newErrors.baccalaureatGrade = 'معدل البكالوريا مطلوب'
    }

    if (stepNumber === 3) {
      if (!formData.interestedOffer) newErrors.interestedOffer = 'العرض المهتم به مطلوب'
      if (!formData.studyBudget) newErrors.studyBudget = 'الميزانية مطلوبة'
      if (!formData.howFoundUs) newErrors.howFoundUs = 'كيف تعرفت علينا مطلوب'
      if (!formData.studyFinancing) newErrors.studyFinancing = 'طريقة التمويل مطلوبة'
      if (!formData.currentLanguageLevel) newErrors.currentLanguageLevel = 'مستوى اللغة مطلوب'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) return

    try {
      const success = await registerStudent(formData)
      if (success) {
        toast({
          title: "تم التسجيل بنجاح! | Inscription réussie!",
          description: "مرحباً بك في Germansphere | Bienvenue chez Germansphere",
        })
        navigate('/') // Redirect students to homepage to see courses
      } else {
        toast({
          title: "خطأ في التسجيل | Erreur d'inscription",
          description: "حاول مرة أخرى | Veuillez réessayer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "خطأ | Erreur",
        description: "حدث خطأ غير متوقع | Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    }
  }

  const handleInputChange = (field: keyof StudentRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          المعلومات الأساسية | Informations de base
        </h2>
        <p className="text-gray-600">الخطوة 1 من 3 | Étape 1 sur 3</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-2" />
            البريد الإلكتروني | E-mail *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="votre@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            الاسم العائلي | Nom de famille *
          </label>
          <input
            type="text"
            value={formData.familyName}
            onChange={(e) => handleInputChange('familyName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.familyName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="بالأحرف الفرنسية | En lettres françaises"
          />
          {errors.familyName && <p className="text-red-500 text-sm mt-1">{errors.familyName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            الاسم الشخصي | Prénom *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="الاسم الشخصي | Votre prénom"
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-2" />
            المدينة | Ville *
          </label>
          <select
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر المدينة | Choisir la ville</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور | Mot de passe *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="6 أحرف على الأقل | Au moins 6 caractères"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تأكيد كلمة المرور | Confirmer le mot de passe *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="أعد كتابة كلمة المرور | Répéter le mot de passe"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          معلومات الاتصال والتعليم | Contact et éducation
        </h2>
        <p className="text-gray-600">الخطوة 2 من 3 | Étape 2 sur 3</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-2" />
            رقم الواتساب | Numéro WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.whatsappNumber}
            onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.whatsappNumber ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="+212 6xx-xxx-xxx"
          />
          {errors.whatsappNumber && <p className="text-red-500 text-sm mt-1">{errors.whatsappNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline w-4 h-4 mr-2" />
            أحسن توقيت للاتصال | Meilleur moment d'appel *
          </label>
          <select
            value={formData.bestCallTime}
            onChange={(e) => handleInputChange('bestCallTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.bestCallTime ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر الوقت | Choisir l'heure</option>
            {callTimes.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          {errors.bestCallTime && <p className="text-red-500 text-sm mt-1">{errors.bestCallTime}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <GraduationCap className="inline w-4 h-4 mr-2" />
            المستوى الدراسي | Niveau d'études *
          </label>
          <select
            value={formData.educationLevel}
            onChange={(e) => handleInputChange('educationLevel', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر المستوى | Choisir le niveau</option>
            {educationLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.educationLevel && <p className="text-red-500 text-sm mt-1">{errors.educationLevel}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="inline w-4 h-4 mr-2" />
            معدل البكالوريا | Note du Baccalauréat *
          </label>
          <input
            type="text"
            value={formData.baccalaureatGrade}
            onChange={(e) => handleInputChange('baccalaureatGrade', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.baccalaureatGrade ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="مثال: 15.50 أو جيد جداً | Ex: 15.50 ou Très Bien"
          />
          {errors.baccalaureatGrade && <p className="text-red-500 text-sm mt-1">{errors.baccalaureatGrade}</p>}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          تفاصيل الدراسة والتمويل | Détails d'études et financement
        </h2>
        <p className="text-gray-600">الخطوة 3 من 3 | Étape 3 sur 3</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BookOpen className="inline w-4 h-4 mr-2" />
            العرض المهتم به | Offre qui vous intéresse *
          </label>
          <select
            value={formData.interestedOffer}
            onChange={(e) => handleInputChange('interestedOffer', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.interestedOffer ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر العرض | Choisir l'offre</option>
            {offers.map(offer => (
              <option key={offer} value={offer}>{offer}</option>
            ))}
          </select>
          {errors.interestedOffer && <p className="text-red-500 text-sm mt-1">{errors.interestedOffer}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Euro className="inline w-4 h-4 mr-2" />
            ميزانية الدراسة في ألمانيا | Budget d'études en Allemagne *
          </label>
          <select
            value={formData.studyBudget}
            onChange={(e) => handleInputChange('studyBudget', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.studyBudget ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر الميزانية | Choisir le budget</option>
            {budgetRanges.map(budget => (
              <option key={budget} value={budget}>{budget}</option>
            ))}
          </select>
          {errors.studyBudget && <p className="text-red-500 text-sm mt-1">{errors.studyBudget}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-2" />
            كيف تعرفت علينا | Comment nous avez-vous connus *
          </label>
          <select
            value={formData.howFoundUs}
            onChange={(e) => handleInputChange('howFoundUs', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.howFoundUs ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر المصدر | Choisir la source</option>
            {discoverySources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          {errors.howFoundUs && <p className="text-red-500 text-sm mt-1">{errors.howFoundUs}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-2" />
            طريقة تمويل الدراسة | Mode de financement *
          </label>
          <select
            value={formData.studyFinancing}
            onChange={(e) => handleInputChange('studyFinancing', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.studyFinancing ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر طريقة التمويل | Choisir le financement</option>
            {financingSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          {errors.studyFinancing && <p className="text-red-500 text-sm mt-1">{errors.studyFinancing}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CheckCircle className="inline w-4 h-4 mr-2" />
            مستوى اللغة الألمانية الحالي | Niveau actuel d'allemand *
          </label>
          <select
            value={formData.currentLanguageLevel}
            onChange={(e) => handleInputChange('currentLanguageLevel', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.currentLanguageLevel ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">اختر المستوى | Choisir le niveau</option>
            {languageLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.currentLanguageLevel && <p className="text-red-500 text-sm mt-1">{errors.currentLanguageLevel}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              التسجيل كطالب | Inscription étudiant
            </h1>
            <p className="text-lg text-gray-600">
              انضم إلى Germansphere وابدأ رحلتك نحو ألمانيا
            </p>
            <p className="text-lg text-gray-600">
              Rejoignez Germansphere et commencez votre voyage vers l'Allemagne
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">المعلومات الأساسية</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">الاتصال والتعليم</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">الدراسة والتمويل</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={step === 1}
                className={`px-6 py-3 rounded-lg font-medium ${
                  step === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                السابق | Précédent
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  التالي | Suivant
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'جاري التسجيل... | Inscription...' : 'إنهاء التسجيل | Terminer l\'inscription'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              لديك حساب بالفعل؟ | Vous avez déjà un compte ?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                تسجيل الدخول | Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentRegistrationPage
