import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, MapPin, Users, CheckCircle2, X, QrCode, Copy, ExternalLink, Loader2, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, apiGet } from "@/api/axios";
import { toast } from "sonner";

const TrainerTrainingManagement: React.FC = () => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"sessions" | "trainees">("sessions");
  const [trainees, setTrainees] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "manage" | "profile" | "qr">("create");
  const [selectedData, setSelectedData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // QR State — now using base64 from session object directly
  const [qrData, setQrData] = useState<{
    qr_token: string;
    enrollment_link: string;
    qr_image_base64: string;
    session_type: string;
    meeting_link?: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    session_type: "OFFLINE",
    start_time: "",
    end_time: "",
    location: "",
    meeting_link: "",
    is_completed: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, sessionsRes, coursesRes] = await Promise.all([
        apiFetch("/api/users/?role=TRAINEE"),
        apiFetch("/api/trainer/sessions/full/"),
        apiFetch("/api/courses/"),
      ]);
      const [usersData, sessionsData, coursesData] = await Promise.all([
        usersRes.json(), sessionsRes.json(), coursesRes.json(),
      ]);
      setTrainees(Array.isArray(usersData) ? usersData.filter((u: any) => u.role === "TRAINEE") : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = modalType === "manage"
        ? `/api/sessions/${selectedData.id}/`
        : `/api/sessions/`;
      const method = modalType === "manage" ? "PUT" : "POST";
      const payload = { ...formData, trainer: user?.id, session_type: formData.session_type === "VIRTUAL" ? "ONLINE" : formData.session_type };
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(modalType === "manage" ? "Session updated!" : "Session created!");
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(JSON.stringify(err));
      }
    } catch (err) {
      toast.error("Error saving session");
    }
  };

  const openQrModal = (session: any) => {
    setSelectedData(session);
    setModalType("qr");
    setIsModalOpen(true);
    // Use the base64 data directly from the session object
    const frontendBase = window.location.origin;
    setQrData({
      qr_token: session.qr_token,
      enrollment_link: session.enrollment_link || `${frontendBase}/enroll/${session.qr_token}/`,
      qr_image_base64: session.qr_image_base64 || "",
      session_type: session.session_type,
      meeting_link: session.meeting_link,
    });
    setQrLoading(false);
  };

  const downloadQrPng = () => {
    if (!qrData?.qr_image_base64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qrData.qr_image_base64}`;
    link.download = `qr-session-${selectedData?.id || "code"}.png`;
    link.click();
  };

  const shareWhatsApp = () => {
    if (!qrData) return;
    const link = qrData.session_type === "ONLINE" && qrData.meeting_link
      ? qrData.meeting_link
      : qrData.enrollment_link;
    const msg = encodeURIComponent(`Join our training session: ${selectedData?.title || ""}\n${link}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const openCreateModal = () => {
    setFormData({ title: "", course: courses[0]?.id?.toString() || "", session_type: "OFFLINE", start_time: "", end_time: "", location: "", meeting_link: "", is_completed: false });
    setModalType("create");
    setIsModalOpen(true);
  };

  const openManageModal = (session: any) => {
    setSelectedData(session);
    setFormData({
      title: session.title || "",
      course: session.course?.toString() || "",
      session_type: session.session_type || "OFFLINE",
      start_time: session.start_time ? session.start_time.slice(0, 16) : "",
      end_time: session.end_time ? session.end_time.slice(0, 16) : "",
      location: session.location || "",
      meeting_link: session.meeting_link || "",
      is_completed: session.is_completed || false,
    });
    setModalType("manage");
    setIsModalOpen(true);
  };

  const openProfileModal = async (trainee: any) => {
    setSelectedData(trainee);
    setModalType("profile");
    setIsModalOpen(true);
    setProfileData(null);
    try {
      const res = await apiFetch(`/api/trainee/${trainee.id}/report-card/`);
      if (res.ok) setProfileData(await res.json());
    } catch { /* silent */ }
  };

  const filteredTrainees = useMemo(
    () => trainees.filter((t) =>
      `${t.first_name} ${t.last_name} ${t.username}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [trainees, searchTerm]
  );

  const filteredSessions = useMemo(
    () => sessions.filter((s) =>
      (s.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.session_type || "").toLowerCase().includes(searchTerm.toLowerCase())
    ), [sessions, searchTerm]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600 mt-1">Manage your assigned trainees and sessions</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">+ Create Session</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["sessions", "trainees"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchTerm(""); }}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "sessions" ? "My Sessions" : "Trainee Directory"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {/* Sessions */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <p className="text-gray-500">No sessions found.</p>
                </Card>
              ) : (
                filteredSessions.map((session) => (
                  <Card key={session.id} className={`p-5 hover:shadow-md transition-shadow border-l-4 ${session.status === "COMPLETED" ? "border-l-green-500" : session.status === "ONGOING" ? "border-l-orange-500" : "border-l-blue-500"}`}>
                    <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            session.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                            session.status === "ONGOING" ? "bg-orange-100 text-orange-700" :
                            session.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                            "bg-blue-50 text-blue-700"
                          }`}>{session.status || "SCHEDULED"}</span>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{session.session_type}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{session.title || "Untitled Session"}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openQrModal(session)} className="flex items-center gap-1.5 text-sm">
                          <QrCode className="w-3.5 h-3.5" /> QR Code
                        </Button>
                        {session.status !== "COMPLETED" && (
                          <Button variant="outline" size="sm" onClick={() => openManageModal(session)}>Edit</Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(session.start_time).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-semibold text-blue-600 truncate max-w-[120px]">{session.location || session.meeting_link || "TBD"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Enrolled</p>
                          <p className="text-sm font-semibold text-gray-900">{(session.trainees || []).length} / {session.max_trainees || "∞"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Trainees */}
          {activeTab === "trainees" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrainees.length === 0 ? (
                <Card className="p-12 text-center col-span-full border-dashed">
                  <p className="text-gray-500">No trainees found.</p>
                </Card>
              ) : (
                filteredTrainees.map((trainee) => (
                  <Card key={trainee.id} className="p-5 hover:shadow-lg transition-all bg-white group">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {(trainee.first_name?.[0] || trainee.username[0]).toUpperCase()}{(trainee.last_name?.[0] || "").toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {trainee.first_name} {trainee.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">{trainee.employee_id || trainee.username}</p>
                        <p className="text-xs text-gray-400">{trainee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span className="text-green-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => openProfileModal(trainee)} className="text-blue-600 hover:bg-blue-50">
                        View Profile
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {modalType === "create" ? "Create Session" : modalType === "manage" ? "Edit Session" : modalType === "qr" ? "QR Enrollment Code" : "Trainee Profile"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create / Edit form */}
            {(modalType === "create" || modalType === "manage") && (
              <form onSubmit={handleSaveSession} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Course</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    required
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Start Time</label>
                    <Input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">End Time</label>
                    <Input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.session_type}
                      onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                    >
                      <option value="OFFLINE">Offline</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      {formData.session_type === "ONLINE" ? "Meeting Link" : "Location"}
                    </label>
                    <Input
                      value={formData.session_type === "ONLINE" ? formData.meeting_link : formData.location}
                      onChange={(e) =>
                        formData.session_type === "ONLINE"
                          ? setFormData({ ...formData, meeting_link: e.target.value })
                          : setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                </div>
                {modalType === "manage" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_completed} onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-gray-700">Mark as Completed</span>
                  </label>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
                </div>
              </form>
            )}

            {/* QR Code Modal */}
            {modalType === "qr" && (
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-gray-900">{selectedData?.title}</p>
                  <p className="text-sm text-gray-500">
                    {selectedData?.start_time &&
                      new Date(selectedData.start_time).toLocaleDateString("en-IN", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                    {" · "}
                    <span className={`font-medium ${selectedData?.session_type === "ONLINE" ? "text-blue-600" : "text-green-600"}`}>
                      {selectedData?.session_type}
                    </span>
                  </p>
                </div>

                {qrLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : qrData ? (
                  <>
                    {/* QR Image */}
                    <div className="flex justify-center">
                      {qrData.qr_image_base64 ? (
                        <img
                          src={`data:image/png;base64,${qrData.qr_image_base64}`}
                          alt="QR Code"
                          className="w-52 h-52 border border-gray-200 rounded-xl p-2 bg-white shadow-sm"
                        />
                      ) : (
                        <div className="w-52 h-52 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
                          <QrCode className="w-12 h-12" />
                          <p className="text-xs">QR not generated yet</p>
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Enrollment Link</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs text-blue-700 bg-blue-50 px-2 py-1.5 rounded truncate">
                            {qrData.enrollment_link}
                          </code>
                          <button
                            onClick={() => copyLink(qrData.enrollment_link)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                          <a
                            href={qrData.enrollment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </a>
                        </div>
                      </div>
                      {qrData.session_type === "ONLINE" && qrData.meeting_link && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Meeting Link</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded truncate">
                              {qrData.meeting_link}
                            </code>
                            <button
                              onClick={() => copyLink(qrData.meeting_link!)}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title="Copy meeting link"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadQrPng}
                        disabled={!qrData.qr_image_base64}
                        className="flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Download QR
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => copyLink(qrData.enrollment_link)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                      >
                        <Copy className="w-4 h-4" /> Copy Link
                      </Button>
                      {qrData.session_type === "ONLINE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={shareWhatsApp}
                          className="col-span-2 flex items-center gap-1.5 border-green-400 text-green-700 hover:bg-green-50"
                        >
                          <Share2 className="w-4 h-4" /> Share via WhatsApp
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-red-500">Failed to load QR data.</p>
                )}
              </div>
            )}

            {/* Profile Modal */}
            {modalType === "profile" && (
              profileData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
                      {(selectedData?.first_name?.[0] || selectedData?.username?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{selectedData?.first_name} {selectedData?.last_name}</h3>
                      <p className="text-sm text-gray-500">{selectedData?.employee_id || selectedData?.username}</p>
                      <p className="text-xs text-gray-400">{selectedData?.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Attendance</p>
                      <p className="text-2xl font-bold text-blue-600">{profileData?.attendance?.rate}%</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Score</p>
                      <p className="text-2xl font-bold text-green-600">{profileData?.score_analysis?.overall_percentage}%</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-medium text-gray-700">Performance: <span className={`font-semibold ${(profileData?.score_analysis?.overall_percentage || 0) >= 75 ? "text-green-600" : "text-amber-600"}`}>{profileData?.score_analysis?.performance_level}</span></p>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profileData?.score_analysis?.general_recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <p>Loading profile...</p>
                </div>
              )
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrainerTrainingManagement;
