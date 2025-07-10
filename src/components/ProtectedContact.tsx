import { Phone, Mail, Globe, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedContactProps {
  phone?: string
  email?: string
  website?: string
  schoolName: string
}

export function ProtectedContact({ phone, email, website, schoolName }: ProtectedContactProps) {
  const { user } = useAuth()

  if (user && user.role === 'student') {
    // Angemeldete Studenten sehen alle Kontaktdaten
    return (
      <div className="flex space-x-2">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title={`${schoolName} anrufen: ${phone}`}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title={`E-Mail an ${schoolName}: ${email}`}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Website besuchen"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>
    )
  }

  // Unangemeldete Nutzer sehen gesperrte Kontaktdaten
  return (
    <div className="flex space-x-2">
      <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md">
        <Lock className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 font-medium">
          Kontaktdaten geschützt
        </span>
      </div>
      <button
        onClick={() => {
          // Hier könnte ein Modal oder Redirect zur Anmeldung erfolgen
          window.location.href = '/login'
        }}
        className="px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
        title="Anmelden um Telefon, E-Mail und Website zu sehen"
      >
        Anmelden für Kontakt
      </button>
    </div>
  )
}
