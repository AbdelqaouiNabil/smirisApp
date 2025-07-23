import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { OAuth2Integration, OAuth2Service } from '../components/auth/OAuth2Integration'
import { Button } from '../components/ui/button'

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
  // Add a state to track if we should redirect after login
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (user) {
      if (user.role === 'tutor') {
        navigate('/tutor-dashboard', { replace: true });
      } else if (user.role === 'school') {
        navigate('/school-dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'student') {
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let success = false
      
      if (isLogin) {
        success = await login(formData.email, formData.password)
        if (success) {
          setShouldRedirect(true);
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

  // Add useEffect to handle redirect after user is set
  useEffect(() => {
    if (shouldRedirect && user) {
      if (user.role === 'tutor') {
        navigate('/tutor-dashboard');
      } else if (user.role === 'school') {
        navigate('/school-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'student') {
        navigate('/');
      } else {
        navigate('/');
      }
      setShouldRedirect(false);
    }
  }, [shouldRedirect, user, navigate]);

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
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-2">
                <div className="text-sm text-red-700 font-semibold">{error}</div>
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

          <div className="mt-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-gray-400 text-xs">ODER</span>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm rounded-lg py-2 text-gray-700 font-medium"
              style={{ borderColor: '#4285F4' }}
              onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.13 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.6C43.93 37.36 46.1 31.36 46.1 24.5z"/><path fill="#FBBC05" d="M10.67 28.04a14.5 14.5 0 010-8.08l-7.98-6.2A23.94 23.94 0 000 24c0 3.77.9 7.34 2.69 10.56l7.98-6.52z"/><path fill="#EA4335" d="M24 48c6.13 0 11.64-2.03 15.52-5.52l-7.18-5.6c-2.01 1.35-4.6 2.12-8.34 2.12-6.38 0-11.87-3.63-14.33-8.88l-7.98 6.52C6.73 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
              Mit Google anmelden
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Noch kein Konto?{' '}
            <button
              onClick={() => setIsLogin(false)}
              className="font-medium text-blue-700 hover:text-blue-500"
            >
              Hier registrieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
