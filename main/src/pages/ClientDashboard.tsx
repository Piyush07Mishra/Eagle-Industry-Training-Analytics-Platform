import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Award, BarChart3, Download, Loader2, ShieldCheck, BookOpen, AlertTriangle } from "lucide-react";
import {
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  ChartWrapper,
} from "@/components/TrainingCharts";
import { apiGet } from "@/api/axios";
import { useNavigate } from "react-router-dom";

// SVG Circular Safety Readiness Gauge
function SafetyGauge({ value }: { value: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dashoffset = circ * (1 - clamped / 100);
  const color = clamped >= 80 ? "#16a34a" : clamped >= 60 ? "#f97316" : "#dc2626";
  const label = clamped >= 80 ? "Good" : clamped >= 60 ? "Warning" : "Critical";
  return (
    <div className="flex flex-col items-center">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12} />
        <circle
          cx={70} cy={70} r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x={70} y={65} textAnchor="middle" fontSize={22} fontWeight="bold" fill={color}>{clamped}%</text>
        <text x={70} y={85} textAnchor="middle" fontSize={11} fill="#6b7280">{label}</text>
      </svg>
      <p className="text-xs text-gray-500 -mt-1">Safety Readiness</p>
    </div>
  );
}

interface DashboardData {
  site_name: string;
  total_trainees: number;
  total_sessions: number;
  completed_sessions: number;
  total_certificates: number;
  avg_attendance: number;
  avg_quiz_score: number;
  compliance_rate: number;
  dept_distribution: { name: string; value: number }[];
  session_status_breakdown: { name: string; value: number }[];
  top_trainees: {
    id: number;
    name: string;
    employee_id: string;
    department: string;
    attendance_rate: number;
    sessions_completed: number;
    quiz_avg: number;
  }[];
  monthly_trend: { name: string; traineesEnrolled: number; completionRate: number }[];
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, color, onClick }) => (
  <Card
    className={`p-4 transition-all ${onClick ? "cursor-pointer hover:shadow-xl hover:-translate-y-1 duration-200" : "hover:shadow-md"}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg text-white ${color}`}>{icon}</div>
    </div>
  </Card>
);

const ClientDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet<DashboardData>("/api/client/dashboard/")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard data."); setLoading(false); });
  }, []);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = document.getElementById("client-dashboard-content");
      if (!element) throw new Error("No content");
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 1.5, canvas.height / 1.5],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      pdf.save(`Compliance_Report_${data.site_name}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch {
      // Fallback to CSV
      const rows = [
        ["Name", "Employee ID", "Department", "Attendance %", "Sessions Completed", "Quiz Avg"],
        ...data.top_trainees.map((t) => [t.name, t.employee_id, t.department, `${t.attendance_rate}%`, t.sessions_completed, `${t.quiz_avg}%`]),
      ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dashboard_${data.site_name}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-600 mr-2" />
      <span className="text-gray-600">Loading dashboard...</span>
    </div>
  );

  if (error || !data) return <div className="p-8 text-center text-red-500">{error || "No data."}</div>;

  // Risk flags
  const riskFlags: string[] = [];
  if (data.avg_attendance < 70) riskFlags.push(`Low avg attendance: ${data.avg_attendance}%`);
  if (data.compliance_rate < 70) riskFlags.push(`Compliance below target: ${data.compliance_rate}%`);
  if (data.avg_quiz_score < 60) riskFlags.push(`Low avg quiz score: ${data.avg_quiz_score}%`);
  if (data.total_trainees === 0) riskFlags.push("No trainees registered for this site.");

  return (
    <div id="client-dashboard-content" className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Analytics</h1>
          <p className="text-gray-600 mt-1">Site: <span className="font-semibold text-gray-800">{data.site_name}</span></p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      {/* Safety Readiness + Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauge */}
        <Card className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <SafetyGauge value={data.compliance_rate} />
          <p className="text-sm font-semibold text-gray-700 mt-2">
            {data.compliance_rate >= 80 ? "Compliant" : data.compliance_rate >= 60 ? "At Risk" : "Non-Compliant"}
          </p>
        </Card>

        {/* Compliance breakdown cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Attendance</span>
            </div>
            <p className="text-3xl font-black text-blue-700">{data.avg_attendance}%</p>
            <div className="mt-2 h-2 bg-blue-100 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${data.avg_attendance}%` }} />
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Certificates</span>
            </div>
            <p className="text-3xl font-black text-green-700">{data.total_certificates}</p>
            <p className="text-xs text-green-600 mt-1">issued to {data.total_trainees} trainees</p>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Quiz Pass Rate</span>
            </div>
            <p className="text-3xl font-black text-purple-700">{data.avg_quiz_score}%</p>
            <div className="mt-2 h-2 bg-purple-100 rounded-full">
              <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${data.avg_quiz_score}%` }} />
            </div>
          </Card>
          <Card className="p-4 bg-teal-50 border-teal-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-800">Sessions</span>
            </div>
            <p className="text-3xl font-black text-teal-700">{data.completed_sessions}/{data.total_sessions}</p>
            <p className="text-xs text-teal-600 mt-1">completed</p>
          </Card>
        </div>
      </div>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Risk Flags
          </h4>
          <ul className="space-y-1">
            {riskFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                {flag}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Quick KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<Users className="w-5 h-5" />} label="Total Trainees" value={data.total_trainees} color="bg-blue-500" />
        <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Completion Rate" value={`${data.completed_sessions ? Math.round(data.completed_sessions / Math.max(data.total_sessions,1) * 100) : 0}%`} color="bg-purple-500" />
        <KPICard icon={<ShieldCheck className="w-5 h-5" />} label="Compliance" value={`${data.compliance_rate}%`} color="bg-teal-500" onClick={() => navigate("/client/compliance")} />
        <KPICard icon={<Award className="w-5 h-5" />} label="Certificates" value={data.total_certificates} color="bg-green-500" onClick={() => navigate("/client/compliance")} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Department Distribution" description="Trainees by department">
          <PieChartComponent data={data.dept_distribution} />
        </ChartWrapper>
        <ChartWrapper title="Session Status" description="Breakdown of session statuses">
          <PieChartComponent data={data.session_status_breakdown} />
        </ChartWrapper>
      </div>

      <ChartWrapper title="Monthly Training Trend" description="Trainees enrolled and completions per month">
        <LineChartComponent data={data.monthly_trend} dataKey="traineesEnrolled" stroke="#f97316" height={220} />
      </ChartWrapper>

      {/* Top Trainees */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Trainees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Dept</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Attendance</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Sessions</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Quiz Avg</th>
              </tr>
            </thead>
            <tbody>
              {data.top_trainees.slice(0, 10).map((t, idx) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-500 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.employee_id}</p>
                  </td>
                  <td className="py-3 px-3 text-gray-500">{t.department}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-semibold ${t.attendance_rate >= 75 ? "text-green-600" : "text-red-600"}`}>{t.attendance_rate}%</span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700">{t.sessions_completed}</td>
                  <td className="py-3 px-3 text-right text-blue-600 font-semibold">{t.quiz_avg}%</td>
                </tr>
              ))}
              {data.top_trainees.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No trainee data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientDashboard;
