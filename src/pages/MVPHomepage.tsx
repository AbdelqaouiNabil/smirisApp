import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Users, Award, Star, Clock, CheckCircle, ArrowRight, Search, Filter, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function MVPHomepage() {
  const { t } = useTranslation('homepage')
  const { user, isAuthenticated } = useAuth()

  // MVP Core Features - nur die 3 wichtigsten
  const coreFeatures = [
    {
      icon: Search,
      title: 'Vergleichen & Finden',
      description: 'Check24-Style Vergleich von Schulen, Kursen und Tutoren mit Live-Preisen und Bewertungen',
      action: 'Jetzt vergleichen',
      link: '/vergleichen',
      color: 'emerald'
    },
    {
      icon: Users,
      title: 'Premium Tutoren',
      description: '1-zu-1 Unterricht mit zertifizierten Tutoren. Prüfungsvorbereitung A1-C2, TestDaF, DSH',
      action: 'Tutoren finden',
      link: '/tutoren',
      color: 'blue'
    },
    {
      icon: Award,
      title: 'Zertifizierte Schulen',
      description: 'Deutschkurse in Top-Sprachschulen mit Goethe-Zertifizierung und Live-Verfügbarkeit',
      action: 'Schulen entdecken',
      link: '/schulen',
      color: 'purple'
    }
  ]

  // Prüfungsfocus für MVP
  const examTypes = [
    { name: 'A1-C2 Zertifikate', provider: 'Goethe, TELC, ÖSD', popularity: '95%' },
    { name: 'TestDaF', provider: 'Für Hochschulzugang', popularity: '87%' },
    { name: 'DTZ', provider: 'Deutsch-Test für Zuwanderer', popularity: '78%' },
    { name: 'DSH', provider: 'Deutsche Sprachprüfung', popularity: '65%' }
  ]

  // Erfolgsstatistiken
  const stats = [
    { number: '1,200+', label: 'Erfolgreiche Schüler', icon: Users },
    { number: '98%', label: 'Prüfungserfolg', icon: Award },
    { number: '24h', label: 'Antwortzeit', icon: Clock },
    { number: '4.8/5', label: 'Kundenbewertung', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      
      {/* Welcome Message for Students */}
      {isAuthenticated && user?.role === 'student' && (
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg font-medium">
              🎉 Willkommen zurück, {user.name || user.firstName}! 
              <span className="font-normal ml-2">
                Entdecke Kurse, buche Tutoren und vergleiche Schulen - alles ohne Einschränkungen!
              </span>
            </p>
          </div>
        </div>
      )}
      
      {/* Hero Section - MVP Focused */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          
          {/* Value Proposition Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-blue-100 border border-emerald-200 rounded-full px-6 py-3 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
            <span className="text-emerald-700 font-medium">🇩🇪 Deutschlands #1 Sprachlern-Plattform in Marokko</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Deutsch lernen.<br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Träume verwirklichen.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Vergleiche Sprachschulen, buche Premium-Tutoren und bereite dich optimal auf deine Deutschprüfung vor.
            <strong className="text-emerald-600"> Alles an einem Ort.</strong>
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/vergleichen"
              className="group bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center justify-center"
            >
              <Search className="mr-3 group-hover:scale-110 transition-transform" size={24} />
              Jetzt vergleichen & sparen
              <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            
            <Link
              to="/tutoren"
              className="group border-2 border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 inline-flex items-center justify-center"
            >
              <Users className="mr-3" size={24} />
              Premium Tutoren
            </Link>
          </div>

        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              3 Wege zu deinem Deutsch-Erfolg
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Wähle deinen Weg: Vergleichen, Premium-Tutoren oder zertifizierte Schulen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-emerald-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`text-${feature.color}-600`} size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 line-height-relaxed">{feature.description}</p>
                
                <Link
                  to={feature.link}
                  className={`inline-flex items-center text-${feature.color}-600 font-semibold hover:text-${feature.color}-700 transition-colors group-hover:translate-x-1`}
                >
                  {feature.action}
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Prüfungsvorbereitung Focus */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-full mb-6">
              <Award className="mr-2" size={20} />
              <span className="font-semibold">Prüfungsspezialist</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Deutschprüfung? Wir bereiten dich vor!
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Spezialisierte Tutoren für alle wichtigen Deutschprüfungen mit Erfolgsgarantie
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {examTypes.map((exam, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{exam.name}</h4>
                  <div className="text-sm text-emerald-600 font-semibold">{exam.popularity}</div>
                </div>
                <p className="text-gray-600 text-sm">{exam.provider}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/tutoren?specialization=pruefungsvorbereitung"
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 inline-flex items-center"
            >
              <Award className="mr-3" size={24} />
              Prüfungstutoren finden
            </Link>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Zahlen, die überzeugen
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="text-emerald-600" size={24} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit für deinen Deutsch-Erfolg?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Starte heute mit der besten Deutsch-Lernplattform in Marokko
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/vergleichen"
              className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              <Search className="mr-3" size={24} />
              Jetzt vergleichen
            </Link>
            <Link
              to="/tutor-anmeldung"
              className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300 inline-flex items-center justify-center"
            >
              <Users className="mr-3" size={24} />
              Als Tutor registrieren
            </Link>
          </div>

        </div>
      </section>

    </div>
  )
}
