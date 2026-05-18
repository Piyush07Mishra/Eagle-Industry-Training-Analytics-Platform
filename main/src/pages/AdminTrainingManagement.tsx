import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiGet } from "@/api/axios";

const ITEMS_PER_PAGE = 5;

interface UserRow {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department: string;
  designation: string;
  status: string;
  role: string;
}
interface SessionRow {
  id: string;
  topic: string;
  trainerName: string;
  date: string;
  status: string;
  session_type: string;
}

const AdminTrainingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trainers" | "trainees" | "sessions">("trainers");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [trainers, setTrainers] = useState<UserRow[]>([]);
  const [trainees, setTrainees] = useState<UserRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<"trainer" | "trainee">("trainer");
  const [addForm, setAddForm] = useState({
    username: "", first_name: "", last_name: "", email: "",
    employee_id: "", department: "", designation: "", password: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        apiFetch("/api/users/"),
        apiFetch("/api/sessions/"),
      ]);
      const [users, sessData] = await Promise.all([usersRes.json(), sessionsRes.json()]);

      if (Array.isArray(users)) {
        setTrainers(users.filter((u: any) => u.role === "TRAINER").map((u: any) => ({
          id: String(u.id),
          name: u.first_name ? `${u.first_name} ${u.last_name}`.trim() : u.username,
          email: u.email || "",
          employee_id: u.employee_id || u.username,
          department: u.department || "—",
          designation: u.designation || "Trainer",
          status: "Active",
          role: "TRAINER",
        })));
        setTrainees(users.filter((u: any) => u.role === "TRAINEE").map((u: any) => ({
          id: String(u.id),
          name: u.first_name ? `${u.first_name} ${u.last_name}`.trim() : u.username,
          email: u.email || "",
          employee_id: u.employee_id || u.username,
          department: u.department || "—",
          designation: u.designation || "Trainee",
          status: "Active",
          role: "TRAINEE",
        })));
      }
      if (Array.isArray(sessData)) {
        setSessions(sessData.map((s: any) => ({
          id: String(s.id),
          topic: s.title || s.course_title || `Session #${s.id}`,
          trainerName: s.trainer_name || "—",
          date: s.start_time ? s.start_time.split("T")[0] : "TBD",
          status: s.status || "SCHEDULED",
          session_type: s.session_type || "OFFLINE",
        })));
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filtered data
  const filtered = {
    trainers: trainers.filter(
      (t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             t.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    trainees: trainees.filter(
      (t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             t.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    sessions: sessions.filter(
      (s) => s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
             s.trainerName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  };

  const activeData = filtered[activeTab];
  const totalPages = Math.max(1, Math.ceil(activeData.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginated = activeData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (id: string, role: "trainer" | "trainee" | "session") => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const endpoint = role === "session" ? `/api/sessions/${id}/` : `/api/users/${id}/`;
      const res = await apiFetch(endpoint, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        toast.success("Deleted successfully");
        fetchData();
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const role = addTab === "trainer" ? "TRAINER" : "TRAINEE";
      const res = await apiFetch("/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, role }),
      });
      if (res.ok || res.status === 201) {
        toast.success(`${role === "TRAINER" ? "Trainer" : "Trainee"} added successfully!`);
        setShowAddModal(false);
        setAddForm({ username: "", first_name: "", last_name: "", email: "", employee_id: "", department: "", designation: "", password: "" });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(JSON.stringify(err));
      }
    } catch {
      toast.error("Failed to add user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600 mt-1">Manage trainers, trainees, and sessions</p>
        </div>
        {activeTab !== "sessions" && (
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add New
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["trainers", "trainees", "sessions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); setSearchTerm(""); }}
            className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab} ({filtered[tab].length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading...
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {activeTab === "sessions" ? (
                    <>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Topic</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Trainer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row: any) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {activeTab === "sessions" ? (
                      <>
                        <td className="py-3 px-4 font-medium text-gray-900">{row.topic}</td>
                        <td className="py-3 px-4 text-gray-600">{row.trainerName}</td>
                        <td className="py-3 px-4 text-gray-600">{row.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${row.session_type === "ONLINE" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {row.session_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            row.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            row.status === "ONGOING" ? "bg-blue-100 text-blue-800" :
                            row.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>{row.status}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => handleDelete(row.id, "session")} className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-medium text-gray-900">{row.name}</td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{row.employee_id}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">{row.department}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{row.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">{row.status}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleDelete(row.id, activeTab === "trainers" ? "trainer" : "trainee")}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && activeData.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, activeData.length)} of {activeData.length}
          </p>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add New Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <Card className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-2 mb-5 border-b border-gray-200">
              {(["trainer", "trainee"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAddTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
                    addTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">First Name *</label>
                  <Input value={addForm.first_name} onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Last Name</label>
                  <Input value={addForm.last_name} onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Username *</label>
                <Input value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Employee ID *</label>
                <Input value={addForm.employee_id} onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
                <Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Department</label>
                  <Input value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Designation</label>
                  <Input value={addForm.designation} onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Password *</label>
                <Input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...</> : `Add ${addTab === "trainer" ? "Trainer" : "Trainee"}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminTrainingManagement;
