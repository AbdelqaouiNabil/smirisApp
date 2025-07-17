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
import { apiClient } from '../lib/api';

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

interface AdminTutor {
  id: string
  name: string
  email: string
  registrationDate: string
  lastLogin: string
  status: 'active' | 'inactive' | 'pending'
  city?: string
  isVerified: boolean
  experienceYears?: number
  hourlyRate?: number
  specializations?: string[]
  languages?: string
  totalStudents?: number
  rating?: number
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
  const [tutors, setTutors] = useState<AdminTutor[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [tutorSearchTerm, setTutorSearchTerm] = useState('')
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState('all')

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
      // Fetch real admin dashboard stats
      const response = await apiClient.get('/admin/dashboard') as any;
      const overview = response.overview || {};
      setStats({
        totalUsers: overview.total_users || 0,
        totalSchools: overview.total_schools || 0,
        totalCourses: overview.total_courses || 0,
        totalBookings: overview.total_bookings || 0,
        monthlyRevenue: overview.total_revenue || 0,
        newUsersThisMonth: 0, // You can add this from response.growth if needed
        activeSchools: overview.total_schools || 0, // Adjust if you have active/inactive
        pendingApplications: 0 // Add from response if available
      });
      // Fetch real users for the Benutzer tab
      const usersRes = await apiClient.get('/admin/users') as any;
      const realUsers = (usersRes.users || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        registrationDate: u.created_at,
        lastLogin: u.last_login,
        status: u.is_active ? 'active' : 'inactive',
        city: u.location || '',
        whatsappNumber: u.whatsappNumber || ''
      }));
      setUsers(realUsers);
      
      // Fetch tutors specifically for the Tutors tab
      const tutorsRes = await apiClient.get('/admin/tutors') as any;
      const realTutors = (tutorsRes.tutors || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        registrationDate: t.created_at,
        lastLogin: t.last_login,
        status: t.is_active ? 'active' : 'inactive',
        city: t.location || '',
        isVerified: t.is_verified || false,
        experienceYears: t.experience_years,
        hourlyRate: t.hourly_rate,
        specializations: t.specializations || [],
        languages: t.languages || '',
        totalStudents: t.total_students || 0,
        rating: typeof t.rating === 'string' ? parseFloat(t.rating) || 0: (t.rating || 0)
      }));
      setTutors(realTutors);
      
      // Fetch real schools for the Schulen tab
      const schoolsRes = await apiClient.get('/schools') as any;
      const realSchools = (schoolsRes.schools || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        email: s.email,
        phone: s.phone,
        isActive: s.is_verified || s.is_active,
      }));
      setSchools(realSchools);
      // Fetch real courses for the Kurse tab
      const coursesRes = await apiClient.get('/courses') as any;
      const realCourses = (coursesRes.courses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        price: c.price,
        category: c.category,
      }));
      setCourses(realCourses);
      // Optionally, set other state from response (recentActivity, etc.)
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

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(tutorSearchTerm.toLowerCase()) ||
                         tutor.email.toLowerCase().includes(tutorSearchTerm.toLowerCase())
    const matchesVerification = selectedVerificationStatus === 'all' || 
                               (selectedVerificationStatus === 'verified' && tutor.isVerified) ||
                               (selectedVerificationStatus === 'unverified' && !tutor.isVerified)
    return matchesSearch && matchesVerification
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

  const exportTutorData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Verifiziert,Erfahrung (Jahre),Stundensatz,Spezialisierungen,Sprachen,Studenten,Bewertung,Status\n" +
      filteredTutors.map(tutor => 
        `${tutor.name},${tutor.email},${tutor.isVerified ? 'Ja' : 'Nein'},${tutor.experienceYears || 0},${tutor.hourlyRate || 0},${(tutor.specializations || []).join(';')},${(tutor.languages || '').split(',').join(';')},${tutor.totalStudents || 0},${tutor.rating || 0},${tutor.status}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "tutors_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export erfolgreich",
      description: "Tutor-Daten wurden als CSV exportiert",
    })
  }

  // Delete handlers
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Benutzer wirklich löschen?')) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast({ title: 'Benutzer gelöscht', description: 'Der Benutzer wurde erfolgreich entfernt.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Löschen des Benutzers', description: error.message, variant: 'destructive' });
    }
  };
  const handleDeleteSchool = async (id: number) => {
    if (!window.confirm('Möchten Sie diese Schule wirklich löschen?')) return;
    try {
      await schoolsApi.delete(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Schule gelöscht', description: 'Die Schule wurde erfolgreich entfernt.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Löschen der Schule', description: error.message, variant: 'destructive' });
    }
  };
  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm('Möchten Sie diesen Kurs wirklich löschen?')) return;
    try {
      await coursesApi.delete(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Kurs gelöscht', description: 'Der Kurs wurde erfolgreich entfernt.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Löschen des Kurses', description: error.message, variant: 'destructive' });
    }
  };

  // Activate/Deactivate handlers
  const handleToggleUserStatus = async (user: AdminUser) => {
    const newStatus = user.status !== 'active';
    if (!window.confirm(`Möchten Sie diesen Benutzer wirklich ${newStatus ? 'aktivieren' : 'deaktivieren'}?`)) return;
    try {
      await apiClient.patch(`/admin/users/${user.id}/status`, { is_active: newStatus });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus ? 'active' : 'inactive' } : u));
      toast({ title: `Benutzer ${newStatus ? 'aktiviert' : 'deaktiviert'}`, description: `Der Benutzer wurde erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}.` });
    } catch (error: any) {
      toast({ title: 'Fehler beim Statuswechsel', description: error.message, variant: 'destructive' });
    }
  };
  const handleToggleSchoolStatus = async (school: any) => {
    const newStatus = !school.isActive;
    if (!window.confirm(`Möchten Sie diese Schule wirklich ${newStatus ? 'aktivieren' : 'deaktivieren'}?`)) return;
    try {
      await apiClient.patch(`/schools/${school.id}/status`, { is_active: newStatus });
      setSchools((prev) => prev.map((s) => s.id === school.id ? { ...s, isActive: newStatus } : s));
      toast({ title: `Schule ${newStatus ? 'aktiviert' : 'deaktiviert'}`, description: `Die Schule wurde erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}.` });
    } catch (error: any) {
      toast({ title: 'Fehler beim Statuswechsel', description: error.message, variant: 'destructive' });
    }
  };
  const handleToggleCourseStatus = async (course: any) => {
    const newStatus = !course.isActive;
    if (!window.confirm(`Möchten Sie diesen Kurs wirklich ${newStatus ? 'aktivieren' : 'deaktivieren'}?`)) return;
    try {
      await apiClient.patch(`/courses/${course.id}/status`, { is_active: newStatus });
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, isActive: newStatus } : c));
      toast({ title: `Kurs ${newStatus ? 'aktiviert' : 'deaktiviert'}`, description: `Der Kurs wurde erfolgreich ${newStatus ? 'aktiviert' : 'deaktiviert'}.` });
    } catch (error: any) {
      toast({ title: 'Fehler beim Statuswechsel', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleTutorVerification = async (tutor: AdminTutor) => {
    try {
      await apiClient.patch(`/admin/tutors/${tutor.id}/verify`, {
        is_verified: !tutor.isVerified
      });
      
      setTutors(prev => prev.map(t => 
        t.id === tutor.id ? { ...t, isVerified: !t.isVerified } : t
      ));
      
      toast({
        title: "Verifizierung aktualisiert",
        description: `${tutor.name} wurde ${!tutor.isVerified ? 'verifiziert' : 'deverifiziert'}`,
      });
    } catch (error) {
      console.error('Error toggling tutor verification:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren der Verifizierung",
        variant: "destructive"
      });
    }
  }

  const handleToggleTutorStatus = async (tutor: AdminTutor) => {
    try {
      await apiClient.patch(`/admin/tutors/${tutor.id}/status`, {
        isActive: tutor.status === 'inactive'
      });
      
      setTutors(prev => prev.map(t => 
        t.id === tutor.id ? { ...t, status: tutor.status === 'active' ? 'inactive' : 'active' } : t
      ));
      
      toast({
        title: "Status aktualisiert",
        description: `${tutor.name} wurde ${tutor.status === 'active' ? 'deaktiviert' : 'aktiviert'}`,
      });
    } catch (error) {
      console.error('Error toggling tutor status:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Status",
        variant: "destructive"
      });
    }
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
                    <button className="text-gray-600 hover:text-gray-900" onClick={() => handleToggleUserStatus(user)}>
                      {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteUser(user.id)}>
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

  // Add renderSchoolsTab for the schools tab
  const renderSchoolsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Schulen Verwaltung</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map((school: any) => (
              <tr key={school.id}>
                <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{school.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{school.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{school.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${school.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{school.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" onClick={() => handleToggleSchoolStatus(school)}>
                      {school.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteSchool(school.id)}>
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
  );

  // Update renderCoursesTab to use real course data
  const renderCoursesTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Kurse Verwaltung</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course: any) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap">{course.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{course.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">{course.price} MAD</td>
                <td className="px-6 py-4 whitespace-nowrap">{course.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" onClick={() => handleToggleCourseStatus(course)}>
                      {course.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteCourse(course.id)}>
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
  );

  const renderTutorsTab = () => (
    <div className="space-y-6">
      {/* Tutor Management Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Tutoren Verwaltung</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportTutorData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
            value={tutorSearchTerm}
            onChange={(e) => setTutorSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedVerificationStatus}
          onChange={(e) => setSelectedVerificationStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Verifizierungsstatus</option>
          <option value="verified">Verifiziert</option>
          <option value="unverified">Nicht verifiziert</option>
        </select>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifizierung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erfahrung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stundensatz</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studenten</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bewertung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTutors.map((tutor) => (
              <tr key={tutor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium">{tutor.name.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                      <div className="text-sm text-gray-500">{tutor.email}</div>
                      {tutor.city && (
                        <div className="text-xs text-gray-400 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {tutor.city}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tutor.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tutor.isVerified ? 'Verifiziert' : 'Nicht verifiziert'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tutor.experienceYears || 0} Jahre
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tutor.hourlyRate || 0} €/h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tutor.totalStudents || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{typeof tutor.rating === 'number' ? tutor.rating.toFixed(1) : (parseFloat(tutor.rating) ? parseFloat(tutor.rating).toFixed(1) : '0.0')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    tutor.status === 'active' ? 'bg-green-100 text-green-800' :
                    tutor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100'
                  }`}>
                    {tutor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className={`hover:text-green-900 ${tutor.isVerified ? 'text-green-600' : 'text-yellow-600'}`}
                      onClick={() => handleToggleTutorVerification(tutor)}
                      title={tutor.isVerified ? 'Verifizierung entfernen' : 'Verifizieren'}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" onClick={() => handleToggleTutorStatus(tutor)}>
                      {tutor.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteUser(tutor.id)}>
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

  const renderVisaServicesTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Visa-Dienste Verwaltung</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienst</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Placeholder for visa services data */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">Visa für Studenten</td>
              <td className="px-6 py-4 whitespace-nowrap">Visa-Prozessberatung und Unterstützung</td>
              <td className="px-6 py-4 whitespace-nowrap">500 MAD</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin-Panel</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Benutzerverwaltung
        </button>
        <button
          onClick={() => setActiveTab('tutors')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'tutors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tutoren
        </button>
        <button
          onClick={() => setActiveTab('schools')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'schools' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Schulen
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Kurse
        </button>
        <button
          onClick={() => setActiveTab('visaServices')}
          className={`py-4 px-6 border-b-2 font-medium text-lg ${
            activeTab === 'visaServices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Visa-Dienste
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'dashboard' && renderDashboardTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'tutors' && renderTutorsTab()}
      {activeTab === 'schools' && renderSchoolsTab()}
      {activeTab === 'courses' && renderCoursesTab()}
      {activeTab === 'visaServices' && renderVisaServicesTab()}
    </div>
  )
}

export default AdminPanel