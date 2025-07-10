import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Users, FileText, Star, Award, Globe, Clock, CheckCircle, Building, BarChart3 } from 'lucide-react'

export default function Homepage() {
  const { t } = useTranslation('homepage')

  const features = [
    {
      icon: BookOpen,
      title: t('features.items.schools.title'),
      description: t('features.items.schools.description')
    },
    {
      icon: Users,
      title: t('features.items.tutors.title'),
      description: t('features.items.tutors.description')
    },
    {
      icon: FileText,
      title: t('features.items.visa.title'),
      description: t('features.items.visa.description')
    },
    {
      icon: Award,
      title: t('features.items.support.title'),
      description: t('features.items.support.description')
    }
  ]

  const stats = [
    { number: '2,500+', label: t('stats.students') },
    { number: '15+', label: t('stats.schools') },
    { number: '50+', label: t('stats.tutors') },
    { number: '98%', label: t('stats.success') }
  ]

  const testimonials = [
    {
      name: t('testimonials.items.ahmed.name'),
      role: t('testimonials.items.ahmed.role'),
      content: t('testimonials.items.ahmed.text'),
      rating: 5
    },
    {
      name: t('testimonials.items.fatima.name'),
      role: t('testimonials.items.fatima.role'),
      content: t('testimonials.items.fatima.text'),
      rating: 5
    },
    {
      name: t('testimonials.items.youssef.name'),
      role: t('testimonials.items.youssef.role'),
      content: t('testimonials.items.youssef.text'),
      rating: 5
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        {/* Background Image with Modern Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg-business.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-slate-800/75 to-blue-900/80" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="mb-8">
            <span className="inline-flex items-center bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-white/20 shadow-xl">
              <Globe className="mr-2" size={16} />
              {t('hero.subtitle')}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            {t('hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl mb-10 font-light text-blue-50 drop-shadow-lg max-w-4xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link
              to="/schulen"
              className="group bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 backdrop-blur-sm border border-white/10"
            >
              <BookOpen className="mr-3 group-hover:scale-110 transition-transform" size={28} />
              {t('hero.cta')}
            </Link>
            <Link
              to="/visa-services"
              className="group bg-white/15 backdrop-blur-md border-2 border-white/40 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-white/25 hover:border-white/60 transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-white/10 hover:scale-105"
            >
              <FileText className="mr-3 group-hover:scale-110 transition-transform" size={28} />
              {t('hero.learnMore')}
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <CheckCircle className="mr-3 text-green-400" size={20} />
              <span className="text-blue-100 font-medium">{t('trustIndicators.visaSuccess')}</span>
            </div>
            <div className="flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <Award className="mr-3 text-yellow-400" size={20} />
              <span className="text-blue-100 font-medium">{t('trustIndicators.certified')}</span>
            </div>
            <div className="flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <Users className="mr-3 text-blue-400" size={20} />
              <span className="text-blue-100 font-medium">{t('trustIndicators.personal')}</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/50 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-700 rounded-lg mb-4 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('services.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* German Courses */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <BookOpen className="w-12 h-12 text-blue-700 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('services.germanCourses.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('services.germanCourses.description')}
              </p>
              <ul className="space-y-2 mb-6">
                {(t('services.germanCourses.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/schulen"
                className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
              >
                {t('services.germanCourses.cta')}
              </Link>
            </div>

            {/* Private Tutoring */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-blue-700 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('services.privateTutoring.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('services.privateTutoring.description')}
              </p>
              <ul className="space-y-2 mb-6">
                {(t('services.privateTutoring.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/tutoren"
                className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
              >
                {t('services.privateTutoring.cta')}
              </Link>
            </div>

            {/* Visa Services */}
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <FileText className="w-12 h-12 text-blue-700 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('services.visaServices.title')}</h3>
              <p className="text-gray-600 mb-6">
                {t('services.visaServices.description')}
              </p>
              <ul className="space-y-2 mb-6">
                {(t('services.visaServices.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/visa"
                className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
              >
                {t('services.visaServices.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School Registration CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Sind Sie eine Sprachschule?
              </h2>
              <p className="text-xl mb-8 text-blue-50">
                Registrieren Sie sich bei SmirisGermany und erreichen Sie mehr Deutschlernende in Marokko. 
                Profitieren Sie von unserem professionellen School Management System.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="mr-3 text-emerald-300" size={20} />
                  <span>Professionelles School Dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-3 text-emerald-300" size={20} />
                  <span>Live-Buchungssystem</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-3 text-emerald-300" size={20} />
                  <span>Analytics & Reporting</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-3 text-emerald-300" size={20} />
                  <span>24/7 Support</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/school-registration"
                  className="bg-white text-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                >
                  <Building className="mr-2" size={20} />
                  Jetzt registrieren
                </Link>
                <Link
                  to="/enhanced-school-dashboard"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors inline-flex items-center justify-center"
                >
                  <Award className="mr-2" size={20} />
                  Demo ansehen
                </Link>
              </div>
            </div>
            <div className="lg:pl-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6">SmirisGermany Vorteile:</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-emerald-500 p-2 rounded-lg mr-4">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold">Mehr Studenten erreichen</h4>
                      <p className="text-sm text-blue-100">Zugang zu über 10,000 potenziellen Deutschlernenden</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-500 p-2 rounded-lg mr-4">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold">Effiziente Verwaltung</h4>
                      <p className="text-sm text-blue-100">Komplettes Management-System für Kurse und Buchungen</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-yellow-500 p-2 rounded-lg mr-4">
                      <Star size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold">Reputation aufbauen</h4>
                      <p className="text-sm text-blue-100">Bewertungssystem und Qualitätszertifizierungen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('finalCta.subtitle')}
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('finalCta.cta')}
          </Link>
        </div>
      </section>
    </div>
  )
}
