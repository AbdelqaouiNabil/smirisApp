import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, Search, Users, School, UserCheck, Heart, User, LogOut, Settings, BookOpen } from 'lucide-react'

export default function MVPNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  // MVP Navigation - nur 3 Hauptbereiche
  const mainNavLinks = [
    { 
      to: '/vergleichen', 
      label: 'Vergleichen', 
      icon: Search, 
      description: 'Schulen, Tutoren & Kurse'
    },
    { 
      to: '/schulen', 
      label: 'Schulen', 
      icon: School, 
      description: 'Zertifizierte Sprachschulen'
    },
    { 
      to: '/tutoren', 
      label: 'Tutoren', 
      icon: UserCheck, 
      description: '1-zu-1 & Prüfungsvorbereitung'
    },
    {
      to: '/courses',
      label: 'Kurse',
      icon: BookOpen,
      description: 'Alle verfügbaren Kurse'
    }
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-lg">SG</span>
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  SmirisGermany
                </span>
                <div className="text-xs text-gray-500 leading-none">MVP Platform</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {mainNavLinks.map(({ to, label, icon: Icon, description }) => (
              <Link
                key={to}
                to={to}
                className={`
                  group flex items-center px-6 py-3 rounded-xl font-medium transition-all
                  ${isActivePath(to)
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }
                `}
              >
                <Icon className="mr-3 group-hover:scale-110 transition-transform" size={20} />
                <div className="text-left">
                  <div className="font-semibold">{label}</div>
                  <div className={`text-xs leading-none ${
                    isActivePath(to) ? 'text-emerald-100' : 'text-gray-500'
                  }`}>
                    {description}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Favorites (visible when logged in) */}
            {user && (
              <Link
                to="/favoriten"
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Meine Favoriten"
              >
                <Heart size={20} />
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={16} />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    
                    {user.role === 'tutor' && (
                      <Link
                        to="/tutor-dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <UserCheck className="mr-3" size={16} />
                        Tutor Dashboard
                      </Link>
                    )}
                    
                    {user.role === 'school' && (
                      <Link
                        to="/school-dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <School className="mr-3" size={16} />
                        School Dashboard
                      </Link>
                    )}

                    <Link
                      to="/favoriten"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <Heart className="mr-3" size={16} />
                      Meine Favoriten
                    </Link>

                    <Link
                      to="/einstellungen"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <Settings className="mr-3" size={16} />
                      Einstellungen
                    </Link>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3" size={16} />
                        Abmelden
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  Anmelden
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {mainNavLinks.map(({ to, label, icon: Icon, description }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center p-4 rounded-xl transition-all
                    ${isActivePath(to)
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                    }
                  `}
                >
                  <Icon className="mr-4" size={20} />
                  <div>
                    <div className="font-semibold">{label}</div>
                    <div className={`text-sm ${
                      isActivePath(to) ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      {description}
                    </div>
                  </div>
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-3 text-gray-700 border border-gray-300 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/tutor-anmeldung"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Tutor werden
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false)
            setIsMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}
