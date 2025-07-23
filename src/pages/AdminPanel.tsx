import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import {
  Users,
  School,
  BookOpen,
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
  Phone,
  X,
  FileText,
  Award,
  Clock,
  Star,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Maximize2,
  Download as DownloadIcon,
} from "lucide-react";
import { schoolsApi, coursesApi, API_BASE_URL } from "../lib/api";
import { apiClient } from "../lib/api";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";

interface AdminStats {
  totalUsers: number;
  totalSchools: number;
  totalCourses: number;
  totalBookings: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
  activeSchools: number;
  pendingApplications: number;
  revenueGrowthPercent?: number; // Growth percentage compared to last month
}

interface PageVisibility {
  tutors: boolean;
  schools: boolean;
  courses: boolean;
  visaServices: boolean;
  dashboard: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationDate: string;
  lastLogin: string;
  status: "active" | "inactive" | "pending";
  city?: string;
  whatsappNumber?: string;
}

interface AdminTutor {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  lastLogin: string;
  status: "active" | "inactive" | "pending";
  city?: string;
  isVerified: boolean;
  experienceYears?: number;
  hourlyRate?: number;
  specializations?: string[];
  languages?: string;
  totalStudents?: number;
  rating?: number;
  profile_photo?: string | null;
  cv_file_path?: string | null;
  certificate_files?: string[] | null;
}

const AdminPanel = () => {
  const { user, canAccessAdminPanel, isLoading } = useAuth();
  const { toast } = useToast();

  // Helper function to build file URLs with cache-busting
  const buildFileUrl = (filePath: string | null | undefined): string | null => {
    if (!filePath || typeof filePath !== "string") return null;

    console.log("🔍 Original file path:", filePath);

    // Extract just the filename from the full path
    let fileName = filePath;

    // If it's a full path, extract just the filename
    if (filePath.includes("/") || filePath.includes("\\")) {
      fileName = filePath.split(/[/\\]/).pop() || filePath;
    }

    // Build the correct URL with the backend port
    const cacheBreaker = Date.now();
    const finalUrl = `http://localhost:5000/uploads/${fileName}?v=${cacheBreaker}`;
    console.log("🔗 Built URL with cache-busting:", finalUrl);
    return finalUrl;
  };

  // Modal handlers
  const openTutorModal = (tutor: AdminTutor) => {
    setSelectedTutor(tutor);
    setIsModalOpen(true);
    setSelectedDocument(null);
  };

  const closeTutorModal = () => {
    setSelectedTutor(null);
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const openDocument = (filePath: string, fileName: string) => {
    const url = buildFileUrl(filePath);
    if (!url) {
      toast({
        title: "Fehler",
        description: `${fileName} nicht verfügbar`,
        variant: "destructive",
      });
      return;
    }

    // Determine document type
    const extension = fileName.toLowerCase().split(".").pop();
    const type: "pdf" | "image" = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
    ].includes(extension || "")
      ? "image"
      : "pdf";

    setSelectedDocument({
      filePath: url,
      fileName,
      type,
    });
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSchools: 0,
    totalCourses: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
    activeSchools: 0,
    pendingApplications: 0,
    revenueGrowthPercent: 0,
  });

  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({
    tutors: true,
    schools: true,
    courses: true,
    visaServices: true,
    dashboard: true,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tutors, setTutors] = useState<AdminTutor[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [tutorSearchTerm, setTutorSearchTerm] = useState("");
  const [selectedVerificationStatus, setSelectedVerificationStatus] =
    useState("all");
  const [coursePublisherFilter, setCoursePublisherFilter] = useState<
    "all" | "tutor" | "school"
  >("all");

  // Modal state for tutor details
  const [selectedTutor, setSelectedTutor] = useState<AdminTutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    filePath: string;
    fileName: string;
    type: "pdf" | "image";
  } | null>(null);

  useEffect(() => {
    console.log("🚀 AdminPanel useEffect triggered");
    console.log("👤 Current user:", user);
    console.log("� Auth loading:", isLoading);
    console.log("🔒 Can access admin panel:", canAccessAdminPanel());

    // Wait for authentication to complete before checking access
    if (isLoading) {
      console.log("⏳ Still loading authentication, waiting...");
      return;
    }

    if (!canAccessAdminPanel()) {
      console.log("❌ Access denied - not loading admin data");
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung für das Admin-Panel",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Access granted - admin panel ready");
    // TODO: Add loadAdminData function if needed
  }, [user, isLoading, canAccessAdminPanel, toast]); // Only include stable dependencies

  const togglePageVisibility = (page: keyof PageVisibility) => {
    const newVisibility = {
      ...pageVisibility,
      [page]: !pageVisibility[page],
    };
    setPageVisibility(newVisibility);
    localStorage.setItem(
      "admin_page_visibility",
      JSON.stringify(newVisibility)
    );

    toast({
      title: "Seiteneinstellungen aktualisiert",
      description: `${page} wurde ${
        newVisibility[page] ? "aktiviert" : "deaktiviert"
      }`,
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.name.toLowerCase().includes(tutorSearchTerm.toLowerCase()) ||
      tutor.email.toLowerCase().includes(tutorSearchTerm.toLowerCase());
    const matchesVerification =
      selectedVerificationStatus === "all" ||
      (selectedVerificationStatus === "verified" && tutor.isVerified) ||
      (selectedVerificationStatus === "unverified" && !tutor.isVerified);
    return matchesSearch && matchesVerification;
  });

  const exportUserData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Role,Registration Date,Last Login,Status,City\n" +
      users
        .map(
          (user) =>
            `${user.name},${user.email},${user.role},${user.registrationDate},${
              user.lastLogin
            },${user.status},${user.city || ""}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export erfolgreich",
      description: "Benutzerdaten wurden exportiert",
    });
  };

  const exportTutorData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Verifiziert,Erfahrung (Jahre),Stundensatz,Spezialisierungen,Sprachen,Studenten,Bewertung,Status\n" +
      filteredTutors
        .map(
          (tutor) =>
            `${tutor.name},${tutor.email},${tutor.isVerified ? "Ja" : "Nein"},${
              tutor.experienceYears || 0
            },${tutor.hourlyRate || 0},${(tutor.specializations || []).join(
              ";"
            )},${(tutor.languages || "").split(",").join(";")},${
              tutor.totalStudents || 0
            },${tutor.rating || 0},${tutor.status}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tutors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export erfolgreich",
      description: "Tutor-Daten wurden als CSV exportiert",
    });
  };

  // Delete handlers
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Möchten Sie diesen Benutzer wirklich löschen?"))
      return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast({
        title: "Benutzer gelöscht",
        description: "Der Benutzer wurde erfolgreich entfernt.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen des Benutzers",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTutor = async (id: string) => {
    if (!window.confirm("Möchten Sie diesen Tutor wirklich löschen?")) return;
    try {
      await apiClient.delete(`/admin/users/${id}`); // Uses the user ID from backend
      setTutors((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Tutor gelöscht",
        description: "Der Tutor wurde erfolgreich entfernt.",
      });
    } catch (error: any) {
      console.error("Error deleting tutor:", error);
      toast({
        title: "Fehler beim Löschen des Tutors",
        description:
          error.response?.data?.message ||
          error.message ||
          "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchool = async (id: number) => {
    if (!window.confirm("Möchten Sie diese Schule wirklich löschen?")) return;
    try {
      await schoolsApi.delete(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Schule gelöscht",
        description: "Die Schule wurde erfolgreich entfernt.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen der Schule",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const handleDeleteCourse = async (id: number, isTutorCourse: boolean) => {
    if (!window.confirm("Möchten Sie diesen Kurs wirklich löschen?")) return;
    try {
      if (isTutorCourse) {
        await coursesApi.deleteTutorCourse(id);
      } else {
        await coursesApi.delete(id);
      }
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Kurs gelöscht",
        description: "Der Kurs wurde erfolgreich entfernt.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen des Kurses",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Activate/Deactivate handlers
  const handleToggleUserStatus = async (user: AdminUser) => {
    const newStatus = user.status !== "active";
    if (
      !window.confirm(
        `Möchten Sie diesen Benutzer wirklich ${
          newStatus ? "aktivieren" : "deaktivieren"
        }?`
      )
    )
      return;
    try {
      await apiClient.patch(`/admin/users/${user.id}/status`, {
        is_active: newStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: newStatus ? "active" : "inactive" }
            : u
        )
      );
      toast({
        title: `Benutzer ${newStatus ? "aktiviert" : "deaktiviert"}`,
        description: `Der Benutzer wurde erfolgreich ${
          newStatus ? "aktiviert" : "deaktiviert"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Statuswechsel",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const handleToggleSchoolStatus = async (school: any) => {
    const newStatus = !school.isActive;
    if (
      !window.confirm(
        `Möchten Sie diese Schule wirklich ${
          newStatus ? "aktivieren" : "deaktivieren"
        }?`
      )
    )
      return;
    try {
      await apiClient.patch(`/schools/${school.id}/status`, {
        is_active: newStatus,
      });
      setSchools((prev) =>
        prev.map((s) =>
          s.id === school.id ? { ...s, isActive: newStatus } : s
        )
      );
      toast({
        title: `Schule ${newStatus ? "aktiviert" : "deaktiviert"}`,
        description: `Die Schule wurde erfolgreich ${
          newStatus ? "aktiviert" : "deaktiviert"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Statuswechsel",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const handleToggleCourseStatus = async (course: any) => {
    const newStatus = !course.isActive;
    if (
      !window.confirm(
        `Möchten Sie diesen Kurs wirklich ${
          newStatus ? "aktivieren" : "deaktivieren"
        }?`
      )
    )
      return;
    try {
      await apiClient.patch(`/courses/${course.id}/status`, {
        is_active: newStatus,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, isActive: newStatus } : c
        )
      );
      toast({
        title: `Kurs ${newStatus ? "aktiviert" : "deaktiviert"}`,
        description: `Der Kurs wurde erfolgreich ${
          newStatus ? "aktiviert" : "deaktiviert"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Statuswechsel",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleTutorVerification = async (tutor: AdminTutor) => {
    try {
      await apiClient.patch(`/admin/tutors/${tutor.id}/verify`, {
        is_verified: !tutor.isVerified,
      });

      setTutors((prev) =>
        prev.map((t) =>
          t.id === tutor.id ? { ...t, isVerified: !t.isVerified } : t
        )
      );

      toast({
        title: "Verifizierung aktualisiert",
        description: `${tutor.name} wurde ${
          !tutor.isVerified ? "verifiziert" : "deverifiziert"
        }`,
      });
    } catch (error) {
      console.error("Error toggling tutor verification:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren der Verifizierung",
        variant: "destructive",
      });
    }
  };

  const handleToggleTutorStatus = async (tutor: AdminTutor) => {
    try {
      await apiClient.patch(`/admin/tutors/${tutor.id}/status`, {
        isActive: tutor.status === "inactive",
      });

      setTutors((prev) =>
        prev.map((t) =>
          t.id === tutor.id
            ? {
                ...t,
                status: tutor.status === "active" ? "inactive" : "active",
              }
            : t
        )
      );

      toast({
        title: "Status aktualisiert",
        description: `${tutor.name} wurde ${
          tutor.status === "active" ? "deaktiviert" : "aktiviert"
        }`,
      });
    } catch (error) {
      console.error("Error toggling tutor status:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Aktualisieren des Status",
        variant: "destructive",
      });
    }
  };

  // TutorDetailModal Component
  const TutorDetailModal = () => {
    if (!selectedTutor || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeTutorModal}
        ></div>

        {/* Modal */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div className="flex items-center space-x-4">
                {selectedTutor.profile_photo ? (
                  <img
                    src={buildFileUrl(selectedTutor.profile_photo)}
                    alt={selectedTutor.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-400"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold text-xl">
                    {selectedTutor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTutor.name}
                  </h2>
                  <p className="text-gray-600">{selectedTutor.email}</p>
                </div>
              </div>
              <button
                onClick={closeTutorModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex h-[calc(95vh-120px)]">
              {/* Left Panel - Tutor Info */}
              <div className="w-1/2 p-6 overflow-y-auto border-r">
                {/* Basic Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Grundinformationen
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Status</div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedTutor.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedTutor.status === "active"
                          ? "Aktiv"
                          : "Inaktiv"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Verifizierung</div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedTutor.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedTutor.isVerified
                          ? "Verifiziert"
                          : "Nicht verifiziert"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Erfahrung</div>
                      <div className="font-semibold">
                        {selectedTutor.experienceYears || 0} Jahre
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Stundensatz</div>
                      <div className="font-semibold">
                        {selectedTutor.hourlyRate || 0} MAD/h
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Studenten</div>
                      <div className="font-semibold">
                        {selectedTutor.totalStudents || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Bewertung</div>
                      <div className="font-semibold flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {typeof selectedTutor.rating === "number"
                          ? selectedTutor.rating.toFixed(1)
                          : parseFloat(selectedTutor.rating || "0").toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📍 Zusätzliche Informationen
                  </h3>
                  <div className="space-y-3">
                    {selectedTutor.city && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">
                          {selectedTutor.city}
                        </span>
                      </div>
                    )}
                    {selectedTutor.languages && (
                      <div className="flex items-start">
                        <div className="text-sm text-gray-600 w-20 flex-shrink-0">
                          Sprachen:
                        </div>
                        <div className="text-gray-700">
                          {selectedTutor.languages}
                        </div>
                      </div>
                    )}
                    {selectedTutor.specializations &&
                      selectedTutor.specializations.length > 0 && (
                        <div className="flex items-start">
                          <div className="text-sm text-gray-600 w-20 flex-shrink-0">
                            Fächer:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedTutor.specializations.map((spec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        Registriert:{" "}
                        {new Date(
                          selectedTutor.registrationDate
                        ).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        Letzter Login:{" "}
                        {new Date(selectedTutor.lastLogin).toLocaleDateString(
                          "de-DE"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📂 Dokumente
                  </h3>
                  <div className="space-y-2">
                    {/* CV */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="font-medium text-blue-900">
                            Lebenslauf (CV)
                          </span>
                        </div>
                        {selectedTutor.cv_file_path ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                openDocument(
                                  selectedTutor.cv_file_path!,
                                  "Lebenslauf.pdf"
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                window.open(
                                  buildFileUrl(selectedTutor.cv_file_path!)!,
                                  "_blank"
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Nicht verfügbar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Certificates */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Award className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-900">
                            Zertifikate
                          </span>
                        </div>
                      </div>
                      {selectedTutor.certificate_files &&
                      selectedTutor.certificate_files.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTutor.certificate_files.map((file, idx) => {
                            if (typeof file !== "string") return null;
                            const fileName = `Zertifikat ${idx + 1}`;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white p-2 rounded border"
                              >
                                <span className="text-sm text-gray-700">
                                  {fileName}
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      openDocument(file, `${fileName}.pdf`)
                                    }
                                    className="text-green-600 hover:text-green-800 p-1 rounded"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      window.open(buildFileUrl(file)!, "_blank")
                                    }
                                    className="text-green-600 hover:text-green-800 p-1 rounded"
                                  >
                                    <DownloadIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Keine Zertifikate verfügbar
                        </span>
                      )}
                    </div>

                    {/* Profile Photo */}
                    {selectedTutor.profile_photo && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-5 h-5 text-purple-600 mr-2">
                              📷
                            </div>
                            <span className="font-medium text-purple-900">
                              Profilbild
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                openDocument(
                                  selectedTutor.profile_photo!,
                                  "Profilbild.jpg"
                                )
                              }
                              className="text-purple-600 hover:text-purple-800 p-1 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                window.open(
                                  buildFileUrl(selectedTutor.profile_photo!)!,
                                  "_blank"
                                )
                              }
                              className="text-purple-600 hover:text-purple-800 p-1 rounded"
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleToggleTutorVerification(selectedTutor)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTutor.isVerified
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {selectedTutor.isVerified ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Deverifizieren
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Verifizieren
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleTutorStatus(selectedTutor)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTutor.status === "active"
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {selectedTutor.status === "active" ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Deaktivieren
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aktivieren
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Möchten Sie diesen Tutor wirklich löschen?"
                        )
                      ) {
                        handleDeleteTutor(selectedTutor.id);
                        closeTutorModal();
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </button>
                </div>
              </div>

              {/* Right Panel - Document Viewer */}
              <div className="w-1/2 bg-gray-50 flex flex-col">
                {selectedDocument ? (
                  <>
                    {/* Document Header */}
                    <div className="p-4 border-b bg-white flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {selectedDocument.fileName}
                      </h4>
                      <button
                        onClick={() => setSelectedDocument(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Document Content */}
                    <div className="flex-1 p-4">
                      {selectedDocument.type === "image" ? (
                        <img
                          src={selectedDocument.filePath}
                          alt={selectedDocument.fileName}
                          className="max-w-full h-auto rounded-lg shadow-md"
                        />
                      ) : (
                        <iframe
                          src={selectedDocument.filePath}
                          className="w-full h-full border-0 rounded-lg shadow-md"
                          title={selectedDocument.fileName}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg mb-2">Kein Dokument ausgewählt</p>
                      <p className="text-sm">
                        Klicken Sie auf ein Dokument links, um es hier
                        anzuzeigen
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">
                Gesamte Benutzer
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-blue-600 text-sm mt-2">
            +{stats.newUsersThisMonth} diesen Monat
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">
                Aktive Schulen
              </p>
              <p className="text-3xl font-bold text-green-900">
                {stats.activeSchools}
              </p>
            </div>
            <School className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-600 text-sm mt-2">
            von {stats.totalSchools} registrierten
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">
                Gesamte Kurse
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {stats.totalCourses.toLocaleString()}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-purple-600 text-sm mt-2">verfügbare Kurse</p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">
                Monatlicher Umsatz
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {stats.monthlyRevenue.toLocaleString()} MAD
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-orange-600 text-sm mt-2">
            {stats.revenueGrowthPercent !== undefined
              ? `${
                  stats.revenueGrowthPercent >= 0 ? "+" : ""
                }${stats.revenueGrowthPercent.toFixed(1)}% vs. letzter Monat`
              : "Keine Daten verfügbar"}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Letzte Aktivitäten (Buchungen)
        </h3>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => {
              const date = new Date(activity.booking_date);
              const daysAgo = Math.floor(
                (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">
                    {activity.booking_count} Buchung
                    {activity.booking_count !== 1 ? "en" : ""}
                    {activity.daily_revenue &&
                      ` (${parseFloat(
                        activity.daily_revenue
                      ).toLocaleString()} MAD)`}
                  </p>
                  <span className="text-gray-500 text-sm">
                    {daysAgo === 0
                      ? "heute"
                      : daysAgo === 1
                      ? "gestern"
                      : `vor ${daysAgo} Tagen`}
                  </span>
                </div>
              );
            })
          ) : (
            // Fallback to static data if no recent activity
            <>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-700">
                  Neue Schule registriert: Atlas Sprachzentrum Marrakech
                </p>
                <span className="text-gray-500 text-sm">vor 2 Stunden</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-gray-700">
                  15 neue Studenten-Anmeldungen heute
                </p>
                <span className="text-gray-500 text-sm">vor 3 Stunden</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-gray-700">
                  42 Kursbuchungen in den letzten 24h
                </p>
                <span className="text-gray-500 text-sm">vor 5 Stunden</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-gray-700">
                  System-Backup erfolgreich abgeschlossen
                </p>
                <span className="text-gray-500 text-sm">vor 8 Stunden</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Benutzer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rolle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registrierung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Letzter Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
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
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : user.role === "school"
                        ? "bg-blue-100 text-blue-800"
                        : user.role === "tutor"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.registrationDate).toLocaleDateString("de-DE")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.lastLogin).toLocaleDateString("de-DE")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : user.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      onClick={() => handleToggleUserStatus(user)}
                    >
                      {user.status === "active" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteUser(user.id)}
                    >
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

  // Add renderSchoolsTab for the schools tab
  const renderSchoolsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Schulen Verwaltung</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map((school: any) => (
              <tr key={school.id}>
                <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {school.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{school.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{school.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      school.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {school.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      onClick={() => handleToggleSchoolStatus(school)}
                    >
                      {school.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteSchool(school.id)}
                    >
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
  const renderCoursesTab = () => {
    // Filter courses by publisher type
    const filteredCourses = courses.filter((course: any) => {
      if (coursePublisherFilter === "all") return true;
      if (coursePublisherFilter === "tutor") return !!course.tutor_id;
      if (coursePublisherFilter === "school")
        return !!course.school_id && !course.tutor_id;
      return true;
    });
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Kurse Verwaltung</h2>
        <div className="flex items-center space-x-4 mb-4">
          <label className="font-medium">Anbieter:</label>
          <select
            className="border rounded px-2 py-1"
            value={coursePublisherFilter}
            onChange={(e) =>
              setCoursePublisherFilter(
                e.target.value as "all" | "tutor" | "school"
              )
            }
          >
            <option value="all">Alle</option>
            <option value="tutor">Von Tutoren</option>
            <option value="school">Von Schulen</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <Card
              key={course.id}
              className="flex flex-col justify-between h-full"
            >
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-gray-700">{course.description}</p>
                <p className="font-semibold text-blue-700">
                  {course.price} MAD
                </p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <button className="text-blue-600 hover:text-blue-900">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-900"
                  onClick={() => handleToggleCourseStatus(course)}
                >
                  {course.isActive ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() =>
                    handleDeleteCourse(course.id, !!course.tutor_id)
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTutorsTab = () => {
    return (
      <div className="space-y-6">
        {/* Tutor Management Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900">
            Tutoren Verwaltung
          </h2>
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

        {/* Tutors Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 min-h-[500px] cursor-pointer relative group border-2 border-transparent hover:border-blue-200"
              onClick={() => openTutorModal(tutor)}
            >
              {/* Click overlay indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Clickable indicator text */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Klicken für Details
                </div>
              </div>
              {/* Header with Profile Photo and Basic Info */}
              <div className="flex flex-col items-center mb-4">
                {tutor.profile_photo ? (
                  <div className="relative">
                    <img
                      src={buildFileUrl(tutor.profile_photo)}
                      alt="Profilfoto"
                      className="w-20 h-20 rounded-full object-cover border-3 border-green-400 cursor-pointer mb-3 hover:border-green-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          `🔍 Profile photo click for ${tutor.name}:`,
                          tutor.profile_photo
                        );
                        openTutorModal(tutor);
                      }}
                      onError={(e) => {
                        console.log(
                          `❌ Image failed to load for ${tutor.name}:`,
                          tutor.profile_photo
                        );
                        const target = e.target as HTMLImageElement;
                        // Use a data URL as fallback to prevent infinite loops
                        const defaultAvatar =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeD0iMjAiIHk9IjIwIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNSIgcj0iOCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzUgMzVWMzJDMzUgMjcuNTggMzEuNDIgMjQgMjcgMjRIMTNDOC41OCAyNCA1IDI3LjU4IDUgMzJWMzVIMzVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4KPC9zdmc+";
                        if (!target.dataset.fallbackUsed) {
                          target.dataset.fallbackUsed = "true";
                          target.src = defaultAvatar;
                        }
                      }}
                      onLoad={() => {
                        console.log(
                          `✅ Profile photo loaded successfully for ${tutor.name}`
                        );
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                      📷
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center text-2xl font-bold text-green-700 mb-3 border-3 border-green-300">
                      {tutor.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                      👤
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {tutor.name}
                  </div>
                  <div className="text-sm text-gray-500 mb-2 flex items-center justify-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {tutor.email}
                  </div>
                  {tutor.city && (
                    <div className="text-xs text-gray-400 flex items-center justify-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {tutor.city}
                    </div>
                  )}
                </div>
              </div>
              {/* Tutor Files Section */}
              <div className="mb-4 space-y-1 bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  📂 Dokumente:
                </div>

                {/* CV Section */}
                {tutor.cv_file_path ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        `🔍 CV access for ${tutor.name}:`,
                        tutor.cv_file_path
                      );
                      openTutorModal(tutor);
                    }}
                    className="w-full text-left text-blue-600 hover:underline text-xs hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-200"
                  >
                    📄 Lebenslauf ansehen
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 px-2 py-1">
                    📄 Kein Lebenslauf verfügbar
                  </div>
                )}

                {/* Certificates Section */}
                {tutor.certificate_files &&
                tutor.certificate_files.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Zertifikate:</div>
                    {tutor.certificate_files.map((file, idx) => {
                      if (typeof file !== "string") {
                        console.log(
                          `⚠️ Invalid certificate file for ${tutor.name}:`,
                          file
                        );
                        return null;
                      }
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              `🔍 Certificate ${idx + 1} access for ${
                                tutor.name
                              }:`,
                              file
                            );
                            openTutorModal(tutor);
                          }}
                          className="w-full text-left text-purple-600 hover:underline text-xs hover:bg-purple-50 px-2 py-1 rounded transition-colors border border-purple-200"
                        >
                          🏆 Zertifikat {idx + 1} ansehen
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 px-2 py-1">
                    🏆 Keine Zertifikate verfügbar
                  </div>
                )}

                {/* Profile Photo Section (if different from header photo) */}
                {tutor.profile_photo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        `🔍 Profile photo access for ${tutor.name}:`,
                        tutor.profile_photo
                      );
                      openTutorModal(tutor);
                    }}
                    className="w-full text-left text-green-600 hover:underline text-xs hover:bg-green-50 px-2 py-1 rounded transition-colors border border-green-200"
                  >
                    🖼️ Profilbild in Vollansicht
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tutor.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {tutor.isVerified ? "Verifiziert" : "Nicht verifiziert"}
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {tutor.experienceYears || 0} Jahre Erfahrung
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  {tutor.hourlyRate || 0} MAD/h
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {tutor.totalStudents || 0} Studenten
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  {typeof tutor.rating === "number"
                    ? tutor.rating.toFixed(1)
                    : parseFloat(tutor.rating)
                    ? parseFloat(tutor.rating).toFixed(1)
                    : "0.0"}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tutor.status === "active"
                      ? "bg-green-100 text-green-800"
                      : tutor.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {tutor.status}
                </span>
              </div>

              {/* Additional Tutor Information */}
              <div className="mb-4 space-y-2">
                {tutor.languages && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Sprachen:</span>{" "}
                    {tutor.languages}
                  </div>
                )}
                {tutor.specializations && tutor.specializations.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Spezialisierungen:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tutor.specializations.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tutor.registrationDate && (
                  <div className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Registriert:{" "}
                    {new Date(tutor.registrationDate).toLocaleDateString(
                      "de-DE"
                    )}
                  </div>
                )}
                {tutor.lastLogin && (
                  <div className="text-xs text-gray-500">
                    Letzter Login:{" "}
                    {new Date(tutor.lastLogin).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-auto">
                <button
                  className="text-blue-600 hover:text-blue-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className={`hover:text-green-900 ${
                    tutor.isVerified ? "text-green-600" : "text-yellow-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTutorVerification(tutor);
                  }}
                  title={
                    tutor.isVerified
                      ? "Verifizierung entfernen"
                      : "Verifizieren"
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTutorStatus(tutor);
                  }}
                >
                  {tutor.status === "active" ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTutor(tutor.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVisaServicesTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Visa-Dienste Verwaltung
      </h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dienst
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Beschreibung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Placeholder for visa services data */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                Visa für Studenten
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                Visa-Prozessberatung und Unterstützung
              </td>
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
      {/* Tutor Detail Modal */}
      <TutorDetailModal />

      {/* Show loading spinner while authentication is in progress */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Authentifizierung wird überprüft...</p>
          </div>
        </div>
      )}

      {/* Show admin panel only when authentication is complete and user has access */}
      {!isLoading && canAccessAdminPanel() && (
        <>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin-Panel</h1>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Benutzerverwaltung
            </button>
            <button
              onClick={() => setActiveTab("tutors")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "tutors"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tutoren
            </button>
            <button
              onClick={() => setActiveTab("schools")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "schools"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Schulen
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "courses"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Kurse
            </button>
            <button
              onClick={() => setActiveTab("visaServices")}
              className={`py-4 px-6 border-b-2 font-medium text-lg ${
                activeTab === "visaServices"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Visa-Dienste
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === "dashboard" && renderDashboardTab()}
          {activeTab === "users" && renderUsersTab()}
          {activeTab === "tutors" && renderTutorsTab()}
          {activeTab === "schools" && renderSchoolsTab()}
          {activeTab === "courses" && renderCoursesTab()}
          {activeTab === "visaServices" && renderVisaServicesTab()}
        </>
      )}

      {/* Show access denied message when authentication is complete but user doesn't have access */}
      {!isLoading && !canAccessAdminPanel() && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Zugriff verweigert
            </h2>
            <p className="text-gray-600">
              Sie haben keine Berechtigung für das Admin-Panel.
            </p>
            <p className="text-gray-500 mt-2">
              Bitte melden Sie sich als Administrator an.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
