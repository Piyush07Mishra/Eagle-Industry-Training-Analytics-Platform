import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import ScrollableChart from "@/components/shared/ScrollableChart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiGet } from "@/api/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrainerRow {
  id: string;
  employee_id: string;
  name: string;
  score: number;
  averageRating: number;
  performance: number;
  sessionsCount: number;
}

interface TraineeRow {
  id: string;
  employee_id: string;
  name: string;
  score: number;
  department: string;
}

interface SessionRow {
  id: string;
  topic: string;
  date: string;
  status: string;
  attendancePercentage: number;
  trainerId: string | null;
  site: string;
}

interface GapRow {
  topic: string;
  category: string;
  avg_score: number;
  pass_rate: number;
  attempts: number;
  status: "critical" | "warning" | "good";
}

interface DashboardData {
  trainers: TrainerRow[];
  trainees: TraineeRow[];
  sessions: SessionRow[];
  gapAnalysis: GapRow[];
  totalTrainers: number;
  totalTrainees: number;
  totalSessions: number;
  completedSessions: number;
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, sub, color }) => (
  <Card className="p-4 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-green-600 font-semibold mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-lg text-white ${color} opacity-90`}>{icon}</div>
    </div>
  </Card>
);

// ── Status badge helper ────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const upper = (status ?? "").toUpperCase();
  const cls =
    upper === "COMPLETED"
      ? "bg-green-100 text-green-800"
      : upper === "ONGOING"
      ? "bg-blue-100 text-blue-800"
      : "bg-yellow-100 text-yellow-800";
  const label =
    upper === "COMPLETED" ? "Completed" : upper === "ONGOING" ? "Ongoing" : "Scheduled";
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiGet<DashboardData>("/api/admin-dashboard/")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard data."); setLoading(false); });
  }, []);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = document.getElementById("admin-dashboard-content");
      if (!element) throw new Error("No content");
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 1.5, canvas.height / 1.5],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      pdf.save(`Admin_Dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch {
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading dashboard...</span>
      </div>
    );

  if (error || !data)
    return <div className="p-8 text-center text-red-500">{error || "No data."}</div>;

  // Derived KPIs
  const { totalTrainers, totalTrainees, totalSessions, completedSessions, sessions } = data;
  const avgAttendance =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.attendancePercentage, 0) / sessions.length)
      : 0;
  const completionRate =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Chart data
  const trainerChartData = data.trainers.map((t) => ({
    name: t.employee_id,
    score: t.score,
    rating: Math.round(t.averageRating * 20),
    sessions: t.sessionsCount,
  }));

  const traineeChartData = data.trainees.map((t) => ({
    name: t.employee_id,
    score: t.score,
  }));

  // Selected trainer
  const selectedTrainerInfo = selectedTrainer
    ? data.trainers.find((t) => t.id === selectedTrainer)
    : null;
  const trainerSessions = selectedTrainer
    ? sessions.filter((s) => s.trainerId === selectedTrainerInfo?.employee_id)
    : [];

  return (
    <div id="admin-dashboard-content" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview of training system and all user activities</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard icon={<Users className="w-6 h-6" />} label="Total Trainers" value={totalTrainers} color="bg-blue-500" />
        <KPICard icon={<Users className="w-6 h-6" />} label="Total Trainees" value={totalTrainees} color="bg-purple-500" />
        <KPICard icon={<BookOpen className="w-6 h-6" />} label="Total Sessions" value={totalSessions} color="bg-green-500" />
        <KPICard
          icon={<Award className="w-6 h-6" />}
          label="Completed"
          value={completedSessions}
          sub={`${completionRate}% rate`}
          color="bg-orange-500"
        />
        <KPICard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          color="bg-pink-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <ScrollableChart
            itemCount={trainerChartData.length}
            itemWidth={90}
            minWidth={400}
            height={280}
            title="Trainer Performance Index"
          >
            {(width) => (
              <BarChart
                width={width}
                height={280}
                data={trainerChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ScrollableChart>
        </Card>
        <Card className="p-6">
          <ScrollableChart
            itemCount={traineeChartData.length}
            itemWidth={90}
            minWidth={400}
            height={280}
            title="Trainee Quiz Score Distribution"
          >
            {(width) => (
              <LineChart
                width={width}
                height={280}
                data={traineeChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            )}
          </ScrollableChart>
        </Card>
      </div>

      {/* Gap Analysis — real data from backend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gap Analysis — Low Scoring Topics</h3>
        {data.gapAnalysis.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            No quiz data yet. Gap analysis will appear once trainees complete quizzes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.gapAnalysis.map((gap, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{gap.topic}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{gap.category}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{gap.avg_score}%</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{gap.pass_rate}%</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{gap.attempts}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          gap.status === "critical"
                            ? "bg-red-100 text-red-800"
                            : gap.status === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {gap.status === "critical" ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : gap.status === "warning" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {gap.status ? gap.status.charAt(0).toUpperCase() + gap.status.slice(1) : "Good"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trainer Drill-Down */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Details</h3>
        <div className="mb-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Trainer</label>
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">— Select a Trainer —</option>
            {data.trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.employee_id})
              </option>
            ))}
          </select>
        </div>

        {selectedTrainerInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">Score</p>
                <p className="text-2xl font-bold text-blue-700">{selectedTrainerInfo.score}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">Sessions</p>
                <p className="text-2xl font-bold text-purple-700">{selectedTrainerInfo.sessionsCount}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">Avg Rating</p>
                <p className="text-2xl font-bold text-green-700">{selectedTrainerInfo.averageRating.toFixed(1)}★</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">Performance</p>
                <p className="text-2xl font-bold text-orange-700">{selectedTrainerInfo.performance}</p>
              </div>
            </div>

            {trainerSessions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Sessions ({trainerSessions.length})
                </h4>
                <div className="space-y-2">
                  {trainerSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.topic}</p>
                        <p className="text-xs text-gray-400">{s.date} · {s.site}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{s.attendancePercentage}% att.</span>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trainerSessions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No sessions found for this trainer.</p>
            )}
          </div>
        )}
      </Card>

      {/* Recent Sessions Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase">Topic</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase">Site</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 text-xs uppercase">Attendance</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{s.topic}</td>
                  <td className="py-3 px-3 text-gray-500">{s.date}</td>
                  <td className="py-3 px-3 text-gray-500">{s.site}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        s.attendancePercentage >= 75 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {s.attendancePercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
