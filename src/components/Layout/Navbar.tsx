import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useComparison } from '../../contexts/ComparisonContext'
import { useTranslation } from 'react-i18next'
import { Menu, X, User, LogOut, BookOpen, Users, FileText, GraduationCap, Globe, Shield, Building, BarChart3 } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { items } = useComparison()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('navigation')
  
  const totalComparisonItems = items.length

  // RTL support
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setIsLanguageMenuOpen(false)
    // Store language preference with the correct key
    localStorage.setItem('smirisGermany_language', lng)
  }

  // Rollenbasierte Navigation
  const getNavLinks = () => {
    const baseLinks = [
      { to: '/tutoren', label: t('tutors'), icon: GraduationCap },
      { to: '/schulen', label: t('schools'), icon: Users },
      { to: '/kurse', label: 'Kurse', icon: BookOpen },
      { to: '/vergleich', label: 'Vergleich', icon: BarChart3, badge: totalComparisonItems > 0 ? totalComparisonItems : null },
      { to: '/visa', label: t('visa'), icon: FileText }
    ]

    if (user?.role === 'admin') {
      return [
        ...baseLinks,
        { to: '/admin', label: 'Admin Panel', icon: Shield }
      ]
    }

    if (user?.role === 'school') {
      return [
        ...baseLinks,
        { to: '/school-dashboard', label: 'School Dashboard', icon: Building }
      ]
    }

    return baseLinks
  }

  const navLinks = getNavLinks()

  const currentLanguage = i18n.language
  const otherLanguage = currentLanguage === 'fr' ? 'ar' : 'fr'

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-2 rounded-lg shadow-lg">
                <span className="text-white font-bold text-xl">SG</span>
              </div>
              <span className="ml-2 text-xl font-bold text-slate-800">SmirisGermany</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ to, label, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors relative"
              >
                <Icon size={16} />
                <span>{label}</span>
                {badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Globe size={16} />
                <span className="text-lg">
                  {currentLanguage === 'fr' ? '🇫🇷' : '🇲🇦'}
                </span>
                <span className="uppercase">{currentLanguage}</span>
              </button>
              
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => changeLanguage('fr')}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 ${
                      currentLanguage === 'fr' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">🇫🇷</span>
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 ${
                      currentLanguage === 'ar' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">🇲🇦</span>
                    <span>العربية</span>
                  </button>
                </div>
              )}
            </div>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User size={16} />
                  <span>{user.name}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {/* Rollenbasierte Dashboard-Links */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Shield className="inline w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    {user.role === 'school' && (
                      <Link
                        to="/school-dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Building className="inline w-4 h-4 mr-2" />
                        School Dashboard
                      </Link>
                    )}
                    {(user.role === 'student' || user.role === 'tutor') && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="inline w-4 h-4 mr-2" />
                        {t('dashboard')}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/student-registration"
                  className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg"
                >
                  Student registrieren
                </Link>
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg"
                >
                  {t('login')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map(({ to, label, icon: Icon, badge }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-700 block px-3 py-2 rounded-md text-base font-medium relative"
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* Mobile Language Switcher */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-500">{t('language')}</div>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                    currentLanguage === 'fr' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-blue-700'
                  }`}
                >
                  <span className="text-lg">🇫🇷</span>
                  <span>Français</span>
                </button>
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                    currentLanguage === 'ar' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-blue-700'
                  }`}
                >
                  <span className="text-lg">🇲🇦</span>
                  <span>العربية</span>
                </button>
              </div>
              
              {user ? (
                <div className="space-y-1 border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-700 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    <User size={16} />
                    <span>{t('dashboard')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left flex items-center space-x-2 text-gray-700 hover:text-blue-700 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-blue-700 hover:bg-blue-800 text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    {t('login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
