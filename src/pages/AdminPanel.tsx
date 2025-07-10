import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { 
  Users, 
  School, 
  BookOpen, 
  FileText, 
  Settings, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  ShieldCheck,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import { schoolsApi, coursesApi } from '../lib/api'

interface AdminStats {
  totalUsers: number
  totalSchools: number
  totalCourses: number
  totalBookings: number
  monthlyRevenue: number
  newUsersThisMonth: number
  activeSchools: number
  pendingApplications: number
}

interface PageVisibility {
  tutors: boolean
  schools: boolean
  courses: boolean
  visaServices: boolean
  dashboard: boolean
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  registrationDate: string
  lastLogin: string
  status: 'active' | 'inactive' | 'pending'
  city?: string
  whatsappNumber?: string
}

const AdminPanel = () => {
  const { user, canAccessAdminPanel } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSchools: 0,
    totalCourses: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
    activeSchools: 0,
    pendingApplications: 0
  })
  
  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({
    tutors: true,
    schools: true,
    courses: true,
    visaServices: true,
    dashboard: true
  })

  const [users, setUsers] = useState<AdminUser[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')

  useEffect(() => {
    if (!canAccessAdminPanel()) {
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung für das Admin-Panel",
        variant: "destructive"
      })
      return
    }
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      // Lade Schools und Courses aus den JSON-Dateien
      const schoolsResponse = await schoolsApi.getAll({ limit: 100 })
      const coursesResponse = await coursesApi.getAll({ limit: 100 })
      
      const schoolsData = schoolsResponse.data
      const coursesData = coursesResponse.data
      
      setSchools(schoolsData)
      setCourses(coursesData)

      // Simuliere Admin-Statistiken
      setStats({
        totalUsers: 1247,
        totalSchools: schoolsData.length || 610,
        totalCourses: coursesData.length || 2024,
        totalBookings: 456,
        monthlyRevenue: 125000,
        newUsersThisMonth: 89,
        activeSchools: Math.floor((schoolsData.length || 610) * 0.85),
        pendingApplications: 23
      })

      // Simuliere User-Daten
      const mockUsers: AdminUser[] = [
        {
          id: '1',
          name: 'Ahmed El Mansouri',
          email: 'ahmed@student.com',
          role: 'student',
          registrationDate: '2025-06-15',
          lastLogin: '2025-06-22',
          status: 'active',
          city: 'Casablanca',
          whatsappNumber: '+212 6xx-xxx-xxx'
        },
        {
          id: '2',
          name: 'Fatima Benali',
          email: 'fatima@student.com',
          role: 'student',
          registrationDate: '2025-06-10',
          lastLogin: '2025-06-21',
          status: 'active',
          city: 'Rabat',
          whatsappNumber: '+212 6xx-xxx-xxx'
        },
        {
          id: '3',
          name: 'Goethe Institut Casablanca',
          email: 'contact@goethe-casa.com',
          role: 'school',
          registrationDate: '2025-05-20',
          lastLogin: '2025-06-22',
          status: 'active'
        },
        {
          id: '4',
          name: 'Dr. Maria Schmidt',
          email: 'maria@tutor.com',
          role: 'tutor',
          registrationDate: '2025-06-01',
          lastLogin: '2025-06-21',
          status: 'active'
        }
      ]
      setUsers(mockUsers)

      // Lade Page Visibility aus localStorage
      const savedVisibility = localStorage.getItem('admin_page_visibility')
      if (savedVisibility) {
        setPageVisibility(JSON.parse(savedVisibility))
      }

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Admin-Daten",
        variant: "destructive"
      })
    }
  }

  const togglePageVisibility = (page: keyof PageVisibility) => {
    const newVisibility = {
      ...pageVisibility,
      [page]: !pageVisibility[page]
    }
    setPageVisibility(newVisibility)
    localStorage.setItem('admin_page_visibility', JSON.stringify(newVisibility))
    
    toast({
      title: "Seiteneinstellungen aktualisiert",
      description: `${page} wurde ${newVisibility[page] ? 'aktiviert' : 'deaktiviert'}`,
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const exportUserData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Role,Registration Date,Last Login,Status,City\n" +
      users.map(user => 
        `${user.name},${user.email},${user.role},${user.registrationDate},${user.lastLogin},${user.status},${user.city || ''}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "users_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export erfolgreich",
      description: "Benutzerdaten wurden exportiert",
    })
  }

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Gesamte Benutzer</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-blue-600 text-sm mt-2">+{stats.newUsersThisMonth} diesen Monat</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Aktive Schulen</p>
              <p className="text-3xl font-bold text-green-900">{stats.activeSchools}</p>
            </div>
            <School className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-600 text-sm mt-2">von {stats.totalSchools} registrierten</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Gesamte Kurse</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalCourses.toLocaleString()}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-purple-600 text-sm mt-2">verfügbare Kurse</p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Monatlicher Umsatz</p>
              <p className="text-3xl font-bold text-orange-900">{stats.monthlyRevenue.toLocaleString()} MAD</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-orange-600 text-sm mt-2">+12% vs. letzter Monat</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-gray-700">Neue Schule registriert: Atlas Sprachzentrum Marrakech</p>
            <span className="text-gray-500 text-sm">vor 2 Stunden</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">15 neue Studenten-Anmeldungen heute</p>
            <span className="text-gray-500 text-sm">vor 3 Stunden</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <p className="text-gray-700">42 Kursbuchungen in den letzten 24h</p>
            <span className="text-gray-500 text-sm">vor 5 Stunden</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <p className="text-gray-700">System-Backup erfolgreich abgeschlossen</p>
            <span className="text-gray-500 text-sm">vor 8 Stunden</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Management Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportUserData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Benutzer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Nach Namen oder E-Mail suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Rollen</option>
          <option value="student">Studenten</option>
          <option value="school">Schulen</option>
          <option value="tutor">Tutoren</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrierung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Letzter Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.city && (
                        <div className="text-xs text-gray-400 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.city}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'school' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'tutor' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.registrationDate).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.lastLogin).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderContentTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
      
      {/* Page Visibility Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seitensichtbarkeit verwalten</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(pageVisibility).map(([page, visible]) => (
            <div key={page} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {visible ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium capitalize">{page}</span>
              </div>
              <button
                onClick={() => togglePageVisibility(page as keyof PageVisibility)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  visible 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {visible ? 'Aktiv' : 'Deaktiviert'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Schulen gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
            </div>
            <School className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Kurse verfügbar</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Wartende Anträge</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!canAccessAdminPanel()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">Sie haben keine Berechtigung für das Admin-Panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Willkommen zurück, {user?.name}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Benutzer
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Content
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'content' && renderContentTab()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
