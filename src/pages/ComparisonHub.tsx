import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Search, Filter, MapPin, Star, Euro, Clock, Users, 
  Award, CheckCircle, ArrowRight, SortAsc, Heart,
  School, UserCheck, GraduationCap, Calendar, Phone
} from 'lucide-react'

interface ComparisonItem {
  id: number
  type: 'school' | 'tutor' | 'course'
  name: string
  image: string
  rating: number
  reviewCount: number
  price: number
  priceUnit: string
  location: string
  specialties: string[]
  highlights: string[]
  availability: 'verfügbar' | 'begrenzt' | 'ausgebucht'
  verified: boolean
  examPrep?: string[]
  groupSize?: number
  duration?: number
  startDate?: string
}

export default function ComparisonHub() {
  const { t } = useTranslation()
  
  const [activeCategory, setActiveCategory] = useState<'all' | 'schools' | 'tutors' | 'courses'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [favorites, setFavorites] = useState<number[]>([])
  const [comparisonList, setComparisonList] = useState<number[]>([])
  const [items, setItems] = useState<ComparisonItem[]>([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', label: 'Alle Angebote', icon: Search, count: 1250 },
    { id: 'schools', label: 'Sprachschulen', icon: School, count: 253 },
    { id: 'tutors', label: 'Tutoren', icon: UserCheck, count: 186 },
    { id: 'courses', label: 'Kurse', icon: GraduationCap, count: 811 }
  ]

  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir']
  const priceRanges = [
    { label: 'Bis 150 MAD', value: '0-150' },
    { label: '150-300 MAD', value: '150-300' },
    { label: '300-500 MAD', value: '300-500' },
    { label: 'Über 500 MAD', value: '500+' }
  ]

  useEffect(() => {
    loadComparisonData()
  }, [activeCategory])

  const loadComparisonData = async () => {
    setLoading(true)
    
    // Simulate API call with sample data
    const sampleData: ComparisonItem[] = [
      // Schools
      {
        id: 1,
        type: 'school',
        name: 'Goethe Institut Casablanca',
        image: '/images/school-casablanca.jpg',
        rating: 4.9,
        reviewCount: 124,
        price: 2500,
        priceUnit: 'MAD/Monat',
        location: 'Casablanca',
        specialties: ['A1-C2', 'Business Deutsch', 'Prüfungsvorbereitung'],
        highlights: ['Goethe-Zertifizierung', 'Kleine Klassen', 'Zentrale Lage'],
        availability: 'verfügbar',
        verified: true,
        examPrep: ['Goethe A1-C2', 'TestDaF'],
        groupSize: 12
      },
      {
        id: 2,
        type: 'school',
        name: 'Institut für Deutsche Sprache Rabat',
        image: '/images/school-rabat.jpg',
        rating: 4.7,
        reviewCount: 89,
        price: 2200,
        priceUnit: 'MAD/Monat',
        location: 'Rabat',
        specialties: ['Intensivkurse', 'Abendkurse', 'Online-Unterricht'],
        highlights: ['BAMF-anerkannt', 'Flexible Zeiten', 'Native Speaker'],
        availability: 'begrenzt',
        verified: true,
        examPrep: ['TELC', 'ÖSD'],
        groupSize: 15
      },
      
      // Tutors
      {
        id: 3,
        type: 'tutor',
        name: 'Dr. Michael Weber',
        image: '/images/tutor-michael.jpg',
        rating: 4.9,
        reviewCount: 67,
        price: 300,
        priceUnit: 'MAD/Stunde',
        location: 'Casablanca',
        specialties: ['TestDaF Spezialist', 'Akademisches Deutsch', 'C1/C2'],
        highlights: ['PhD Germanistik', '10+ Jahre Erfahrung', 'TestDaF Prüfer'],
        availability: 'begrenzt',
        verified: true,
        examPrep: ['TestDaF', 'DSH', 'Goethe C1/C2']
      },
      {
        id: 4,
        type: 'tutor',
        name: 'Sarah Müller',
        image: '/images/tutor-sabine.jpg',
        rating: 4.8,
        reviewCount: 143,
        price: 250,
        priceUnit: 'MAD/Stunde',
        location: 'Rabat',
        specialties: ['Konversation', 'Business Deutsch', 'A2-B2'],
        highlights: ['Native Speaker', 'DaF-Zertifikat', 'Flexibel'],
        availability: 'verfügbar',
        verified: true,
        examPrep: ['Goethe A2-B2', 'TELC']
      },
      
      // Courses
      {
        id: 5,
        type: 'course',
        name: 'Intensiv B2 Kurs',
        image: '/images/course-b2.jpg',
        rating: 4.6,
        reviewCount: 45,
        price: 1800,
        priceUnit: 'MAD/Kurs',
        location: 'Casablanca',
        specialties: ['B2 Niveau', 'Intensiv', '4 Wochen'],
        highlights: ['Kleine Gruppen', 'Prüfungsgarantie', 'Zertifikat'],
        availability: 'verfügbar',
        verified: true,
        examPrep: ['Goethe B2', 'TELC B2'],
        groupSize: 8,
        duration: 80,
        startDate: '2025-07-07'
      },
      {
        id: 6,
        type: 'course',
        name: 'TestDaF Crashkurs',
        image: '/images/course-c1.jpg',
        rating: 4.8,
        reviewCount: 32,
        price: 2200,
        priceUnit: 'MAD/Kurs',
        location: 'Rabat',
        specialties: ['TestDaF', 'Prüfungsvorbereitung', '2 Wochen'],
        highlights: ['TestDaF Experte', 'Erfolgsgarantie', 'Mock-Tests'],
        availability: 'begrenzt',
        verified: true,
        examPrep: ['TestDaF'],
        groupSize: 6,
        duration: 40,
        startDate: '2025-07-14'
      }
    ]

    // Filter based on category
    let filteredData = sampleData
    if (activeCategory !== 'all') {
      const categoryMap = { schools: 'school', tutors: 'tutor', courses: 'course' }
      filteredData = sampleData.filter(item => item.type === categoryMap[activeCategory])
    }

    setItems(filteredData)
    setLoading(false)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCity = !selectedCity || item.location === selectedCity
    const matchesPrice = !priceRange || checkPriceRange(item.price, priceRange)
    
    return matchesSearch && matchesCity && matchesPrice
  })

  const checkPriceRange = (price: number, range: string) => {
    switch (range) {
      case '0-150': return price <= 150
      case '150-300': return price >= 150 && price <= 300
      case '300-500': return price >= 300 && price <= 500
      case '500+': return price > 500
      default: return true
    }
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'rating': return b.rating - a.rating
      case 'price': return a.price - b.price
      case 'reviews': return b.reviewCount - a.reviewCount
      default: return 0
    }
  })

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    )
  }

  const toggleComparison = (id: number) => {
    setComparisonList(prev => {
      if (prev.includes(id)) {
        return prev.filter(comp => comp !== id)
      } else if (prev.length < 4) {
        return [...prev, id]
      } else {
        return prev // Max 4 items
      }
    })
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'verfügbar': return 'text-green-600 bg-green-100'
      case 'begrenzt': return 'text-yellow-600 bg-yellow-100'
      case 'ausgebucht': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'text-blue-600 bg-blue-100'
      case 'tutor': return 'text-purple-600 bg-purple-100'
      case 'course': return 'text-emerald-600 bg-emerald-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Deutsch lernen vergleichen
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Finden Sie die perfekte Sprachschule, den idealen Tutor oder den passenden Kurs. 
            <span className="text-emerald-600 font-semibold"> Check24-Style Vergleich</span> für alle Angebote.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`
                  flex items-center justify-center p-6 rounded-xl transition-all text-center
                  ${activeCategory === category.id 
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                  }
                `}
              >
                <div>
                  <category.icon className="mx-auto mb-2" size={24} />
                  <div className="font-semibold">{category.label}</div>
                  <div className="text-sm opacity-75">{category.count} Angebote</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-5 gap-4">
            
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Schule, Tutor oder Kurs suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Alle Städte</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Alle Preise</option>
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="rating">Beste Bewertung</option>
                <option value="price">Niedrigster Preis</option>
                <option value="reviews">Meiste Bewertungen</option>
              </select>
            </div>

          </div>

          {/* Quick Stats */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <div className="text-gray-600">
              <span className="font-semibold text-gray-900">{sortedItems.length}</span> Ergebnisse gefunden
            </div>
            {comparisonList.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {comparisonList.length}/4 zum Vergleich ausgewählt
                </span>
                <Link
                  to={`/vergleich?items=${comparisonList.join(',')}`}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all flex items-center"
                >
                  Vergleichen
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Angebote...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.type)}`}>
                      {item.type === 'school' ? 'Schule' : item.type === 'tutor' ? 'Tutor' : 'Kurs'}
                    </span>
                    {item.verified && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <CheckCircle className="mr-1" size={12} />
                        Verifiziert
                      </span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${favorites.includes(item.id) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                        }
                      `}
                    >
                      <Heart className={favorites.includes(item.id) ? 'fill-current' : ''} size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(item.availability)}`}>
                      {item.availability}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center text-yellow-500 mr-2">
                          <Star className="fill-current" size={16} />
                          <span className="ml-1 font-semibold">{item.rating}</span>
                        </div>
                        <span className="text-gray-500 text-sm">({item.reviewCount} Bewertungen)</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin size={14} className="mr-1" />
                        {item.location}
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {item.specialties.slice(0, 3).map(specialty => (
                        <span key={specialty} className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {item.highlights.slice(0, 3).map(highlight => (
                        <li key={highlight} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="text-emerald-500 mr-2 flex-shrink-0" size={14} />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Course/Group Info */}
                  {(item.groupSize || item.duration || item.startDate) && (
                    <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                      {item.groupSize && (
                        <div className="flex items-center text-gray-600">
                          <Users size={14} className="mr-1" />
                          Max. {item.groupSize} Personen
                        </div>
                      )}
                      {item.duration && (
                        <div className="flex items-center text-gray-600">
                          <Clock size={14} className="mr-1" />
                          {item.duration} Stunden
                        </div>
                      )}
                      {item.startDate && (
                        <div className="flex items-center text-gray-600 col-span-2">
                          <Calendar size={14} className="mr-1" />
                          Start: {item.startDate}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{item.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{item.priceUnit}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleComparison(item.id)}
                        disabled={comparisonList.length >= 4 && !comparisonList.includes(item.id)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold text-sm transition-all
                          ${comparisonList.includes(item.id)
                            ? 'bg-emerald-600 text-white'
                            : comparisonList.length >= 4
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }
                        `}
                      >
                        {comparisonList.includes(item.id) ? '✓' : '+'}
                      </button>
                      <Link
                        to={`/${item.type}s/${item.id}`}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center"
                      >
                        Details
                        <ArrowRight className="ml-1" size={14} />
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && sortedItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-gray-600 mb-6">Versuchen Sie andere Suchkriterien oder Filter</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCity('')
                setPriceRange('')
                setActiveCategory('all')
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}

        {/* Floating Comparison Bar */}
        {comparisonList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <span className="font-semibold">{comparisonList.length}</span>
                <span className="ml-1">ausgewählt</span>
              </div>
              <div className="flex space-x-2">
                {comparisonList.map(id => {
                  const item = items.find(i => i.id === id)
                  return item ? (
                    <div key={id} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-emerald-500">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : null
                })}
              </div>
              <Link
                to={`/detaillierter-vergleich?items=${comparisonList.join(',')}`}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center"
              >
                Detailliert vergleichen
                <ArrowRight className="ml-2" size={16} />
              </Link>
              <button
                onClick={() => setComparisonList([])}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
