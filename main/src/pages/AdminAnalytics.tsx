import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScrollableChart from "@/components/shared/ScrollableChart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { COLORS } from "@/components/TrainingCharts";
import { Download, Loader2, TrendingUp, Users, BookOpen, ShieldCheck } from "lucide-react";
import { apiGet } from "@/api/axios";

interface AnalyticsData {
  trainee_progress: { name: string; completed: number; total: number; percentage: number }[];
  gap_analysis: { name: string; gap: number }[];
  compliance_by_dept: { name: string; value: number }[];
  monthly_trend: { name: string; trainings: number; completions: number; non_compliance: number }[];
  summary: {
    total_trainees: number;
    completed_at_least_one: number;
    completion_rate: number;
    compliance_rate: number;
    mandatory_completion_rate: number;
  };
}

const AdminAnalytics: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<"trainee" | "gap" | "compliance">("trainee");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<AnalyticsData>("/api/admin/analytics/")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load analytics."); setLoading(false); });
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;
      const element = document.getElementById("analytics-report-content");
      if (!element) throw new Error("No content");
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      pdf.save(`Analytics_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">{error || "No data available."}</div>;
  }

  return (
    <div className="space-y-6" id="analytics-report-content">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive training analytics and compliance reporting</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Exporting..." : "Download PDF"}
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trainees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.total_trainees}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{data.summary.completion_rate}%</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg"><BookOpen className="w-5 h-5 text-green-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{data.summary.compliance_rate}%</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Mandatory Training</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{data.summary.mandatory_completion_rate}%</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
          </div>
        </Card>
      </div>

      {/* Report Selector */}
      <div className="flex gap-2 border-b border-gray-200">
        {([
          { value: "trainee", label: "Trainee Progress" },
          { value: "gap", label: "Gap Analysis" },
          { value: "compliance", label: "Compliance" },
        ] as const).map((report) => (
          <button
            key={report.value}
            onClick={() => setSelectedReport(report.value)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedReport === report.value
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {report.label}
          </button>
        ))}
      </div>

      {/* Trainee Progress */}
      {selectedReport === "trainee" && (
        <div className="space-y-6">
          <Card className="p-6">
            <ScrollableChart
              itemCount={data.trainee_progress.length}
              itemWidth={90}
              minWidth={400}
              height={280}
              title="Training Completion Rate"
            >
              {(width) => (
                <BarChart
                  width={width}
                  height={280}
                  data={data.trainee_progress}
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
                  <Bar dataKey="percentage" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ScrollableChart>
          </Card>
          <Card className="p-6">
            <ScrollableChart
              itemCount={data.monthly_trend.length}
              itemWidth={90}
              minWidth={400}
              height={280}
              title="Monthly Trainee Completions"
            >
              {(width) => (
                <LineChart
                  width={width}
                  height={280}
                  data={data.monthly_trend}
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
                  <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              )}
            </ScrollableChart>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Total Trainees</p>
                <p className="text-2xl font-bold text-blue-600">{data.summary.total_trainees}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Completed ≥1 Session</p>
                <p className="text-2xl font-bold text-green-600">{data.summary.completed_at_least_one}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-orange-600">{data.summary.completion_rate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Gap Analysis */}
      {selectedReport === "gap" && (
        <div className="space-y-6">
          <Card className="p-6">
            <ScrollableChart
              itemCount={data.gap_analysis.length}
              itemWidth={90}
              minWidth={400}
              height={280}
              title="Training Implementation Gap"
            >
              {(width) => (
                <BarChart
                  width={width}
                  height={280}
                  data={data.gap_analysis}
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
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gap" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ScrollableChart>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gap Analysis Details</h3>
            <div className="space-y-3">
              {data.gap_analysis.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Trainees not yet trained</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${item.gap > 5 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {item.gap}
                  </span>
                </div>
              ))}
              {data.gap_analysis.length === 0 && (
                <p className="text-center text-gray-400 py-4">No gap data available.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Compliance */}
      {selectedReport === "compliance" && (
        <div className="space-y-6">
          <Card className="p-6">
            <ScrollableChart
              itemCount={data.compliance_by_dept.length}
              itemWidth={90}
              minWidth={400}
              height={280}
              title="Compliance by Department"
            >
              {(width) => (
                <PieChart width={width} height={280}>
                  <Pie
                    data={data.compliance_by_dept}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.compliance_by_dept.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ScrollableChart>
          </Card>
          <Card className="p-6">
            <ScrollableChart
              itemCount={data.monthly_trend.length}
              itemWidth={90}
              minWidth={400}
              height={280}
              title="Monthly Non-Compliance Trend"
            >
              {(width) => (
                <LineChart
                  width={width}
                  height={280}
                  data={data.monthly_trend}
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
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="non_compliance" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              )}
            </ScrollableChart>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Overall Compliance Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">{data.summary.compliance_rate}%</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Mandatory Training Completion</p>
                <p className="text-3xl font-bold text-green-600">{data.summary.mandatory_completion_rate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
