import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { OAuth2Integration, OAuth2Service } from '../components/auth/OAuth2Integration'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let success = false
      
      if (isLogin) {
        success = await login(formData.email, formData.password)
        if (success) {
          // Get user role from the correct localStorage key
          const userData = JSON.parse(localStorage.getItem('germansphere_user') || '{}');
          if (userData.role === 'tutor') {
            navigate('/tutor-dashboard')
          } else if (userData.role === 'school') {
            navigate('/school-dashboard')
          } else if (userData.role === 'admin') {
            navigate('/admin')
          } else if (userData.role === 'student') {
            navigate('/') // Redirect students to homepage to see courses
          } else {
            navigate('/') // Default to homepage for any other roles
          }
        } else {
          setError('Ungültige Anmeldedaten')
        }
      } else {
        // If user is registering as a tutor, redirect to tutor registration page
        if (formData.role === 'tutor') {
          navigate('/tutor-registration')
          return
        }
        // If user is registering as a school, redirect to school dashboard
        if (formData.role === 'school') {
          success = await register(formData.name, formData.email, formData.password, formData.role)
          if (success) {
            navigate('/school-dashboard')
          } else {
            setError('Registrierung fehlgeschlagen')
          }
          return
        }
        // For other roles, proceed with normal registration
        success = await register(formData.name, formData.email, formData.password, formData.role)
        if (success) {
          if (formData.role === 'student') {
            navigate('/') // Redirect students to homepage
          } else if (formData.role === 'admin') {
            navigate('/admin')
          } else {
            navigate('/') // Default to homepage
          }
        } else {
          setError('Registrierung fehlgeschlagen')
        }
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // OAuth2 Handlers
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const oauth2Service = OAuth2Service.getInstance()
      const { token, user } = await oauth2Service.loginWithGoogle()
      
      // Simulate login with OAuth2 data
      const success = await login(user.email, 'oauth2_google_login')
      
      if (success) {
        // Check user role and redirect appropriately
        const userData = JSON.parse(localStorage.getItem('germansphere_user') || '{}');
        if (userData.role === 'tutor') {
          navigate('/tutor-dashboard')
        } else if (userData.role === 'school') {
          navigate('/school-dashboard')
        } else if (userData.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/') // Students and others go to homepage
        }
      } else {
        setError('Google-Anmeldung fehlgeschlagen')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google-Anmeldung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const oauth2Service = OAuth2Service.getInstance()
      const { token, user } = await oauth2Service.loginWithFacebook()
      
      const success = await login(user.email, 'oauth2_facebook_login')
      
      if (success) {
        // Check user role and redirect appropriately
        const userData = JSON.parse(localStorage.getItem('germansphere_user') || '{}');
        if (userData.role === 'tutor') {
          navigate('/tutor-dashboard')
        } else if (userData.role === 'school') {
          navigate('/school-dashboard')
        } else if (userData.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/') // Students and others go to homepage
        }
      } else {
        setError('Facebook-Anmeldung fehlgeschlagen')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Facebook-Anmeldung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const oauth2Service = OAuth2Service.getInstance()
      const { token, user } = await oauth2Service.loginWithGithub()
      
      const success = await login(user.email, 'oauth2_github_login')
      
      if (success) {
        // Check user role and redirect appropriately
        const userData = JSON.parse(localStorage.getItem('germansphere_user') || '{}');
        if (userData.role === 'tutor') {
          navigate('/tutor-dashboard')
        } else if (userData.role === 'school') {
          navigate('/school-dashboard')
        } else if (userData.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/') // Students and others go to homepage
        }
      } else {
        setError('GitHub-Anmeldung fehlgeschlagen')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'GitHub-Anmeldung fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-blue-700 to-yellow-500 p-3 rounded-lg">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {isLogin ? 'Bei Ihrem Konto anmelden' : 'Neues Konto erstellen'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Noch kein Konto?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium text-blue-700 hover:text-blue-500"
              >
                Hier registrieren
              </button>
            </>
          ) : (
            <>
              Bereits ein Konto?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium text-blue-700 hover:text-blue-500"
              >
                Hier anmelden
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-sm text-blue-700">{error}</div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Vollständiger Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ihr vollständiger Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail Adresse
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ihre.email@beispiel.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mindestens 6 Zeichen"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Ich bin...
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">Student/in</option>
                    <option value="tutor">Sprachlehrer/in (erweiterte Registrierung)</option>
                    <option value="school">Sprachschule</option>
                    <option value="admin">Administrator/in</option>
                  </select>
                </div>
                {formData.role === 'tutor' && (
                  <p className="mt-1 text-xs text-blue-600">
                    Sprachlehrer werden zu einem erweiterten Registrierungsformular weitergeleitet.
                  </p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Angemeldet bleiben
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-700 hover:text-blue-500">
                    Passwort vergessen?
                  </a>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Wird verarbeitet...' : (isLogin ? 'Anmelden' : 'Registrieren')}
              </button>
            </div>

            {!isLogin && (
              <div className="text-xs text-gray-500 text-center">
                Mit der Registrierung stimmen Sie unseren{' '}
                <a href="#" className="text-blue-700 hover:text-blue-500">
                  Nutzungsbedingungen
                </a>{' '}
                und der{' '}
                <a href="#" className="text-blue-700 hover:text-blue-500">
                  Datenschutzerklärung
                </a>{' '}
                zu.
                <br />
                <span className="mt-2 block">
                  Sind Sie ein Sprachlehrer?{' '}
                  <Link to="/tutor-registration" className="text-blue-700 hover:text-blue-500 font-medium">
                    Hier zur erweiterten Registrierung
                  </Link>
                </span>
              </div>
            )}
          </form>

          {/* OAuth2 Integration */}
          <div className="mt-6">
            <OAuth2Integration
              onGoogleLogin={handleGoogleLogin}
              onFacebookLogin={handleFacebookLogin}
              onGithubLogin={handleGithubLogin}
              isLoading={isLoading}
            />
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo-Anmeldedaten</span>
              </div>
            </div>

            <div className="mt-4 bg-gray-50 rounded-md p-4">
              <p className="text-xs text-gray-600 mb-2">Für Demo-Zwecke können Sie sich mit beliebigen Daten anmelden:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• E-Mail: beliebige gültige E-Mail-Adresse</li>
                <li>• Passwort: mindestens 6 Zeichen</li>
                <li>• Admin-Zugang: E-Mail mit "admin"</li>
                <li>• Tutor-Zugang: E-Mail mit "tutor"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
