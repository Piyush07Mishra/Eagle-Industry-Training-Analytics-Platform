import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, AlertTriangle, CheckCircle, Download, TrendingUp } from "lucide-react";
import { apiGet } from "@/api/axios";
import {
  BarChartComponent,
  PieChartComponent,
  ChartWrapper,
} from "@/components/TrainingCharts";

interface ComplianceData {
  site_name: string;
  total_trainees: number;
  compliant_trainees: number;
  non_compliant_trainees: number;
  compliance_rate: number;
  avg_attendance: number;
  completed_sessions: number;
  total_sessions: number;
  pending_trainings: number;
  department_compliance: { name: string; value: number }[];
  trainee_list: {
    id: number;
    name: string;
    employee_id: string;
    department: string;
    attendance_rate: number;
    sessions_completed: number;
    is_compliant: boolean;
  }[];
}

const ClientCompliance: React.FC = () => {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "compliant" | "non_compliant">("all");

  useEffect(() => {
    apiGet<ComplianceData>("/api/client/compliance/")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load compliance data."); setLoading(false); });
  }, []);

  const handleExport = async () => {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // ── Header bar ──────────────────────────────────────────────
    doc.setFillColor(234, 88, 12); // orange-600
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMPLIANCE REPORT", pageW / 2, 10, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Site: ${data.site_name}   |   Generated: ${now}`, pageW / 2, 17, { align: "center" });

    // ── KPI summary boxes ────────────────────────────────────────
    doc.setTextColor(30, 30, 30);
    const kpis = [
      { label: "Compliance Rate", value: `${data.compliance_rate}%` },
      { label: "Total Trainees",  value: String(data.total_trainees) },
      { label: "Compliant",       value: String(data.compliant_trainees) },
      { label: "Non-Compliant",   value: String(data.non_compliant_trainees) },
      { label: "Avg Attendance",  value: `${data.avg_attendance}%` },
      { label: "Sessions Done",   value: `${data.completed_sessions}/${data.total_sessions}` },
    ];
    const boxW = (pageW - 20) / 3;
    const boxH = 16;
    kpis.forEach((k, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 10 + col * boxW;
      const y = 28 + row * (boxH + 3);
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, boxW - 2, boxH, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(k.label.toUpperCase(), x + (boxW - 2) / 2, y + 5, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(k.value, x + (boxW - 2) / 2, y + 12, { align: "center" });
    });

    // ── Department compliance mini table ─────────────────────────
    let curY = 75;
    if (data.department_compliance?.length) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Department Compliance", 10, curY);
      curY += 3;
      autoTable(doc, {
        startY: curY,
        head: [["Department", "Compliance %"]],
        body: data.department_compliance.map(d => [d.name, `${d.value}%`]),
        theme: "grid",
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 10, right: 10 },
      });
      curY = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Trainee detail table ─────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Trainee Compliance Detail", 10, curY);
    curY += 3;
    autoTable(doc, {
      startY: curY,
      head: [["Name", "Employee ID", "Department", "Attendance", "Sessions", "Status"]],
      body: data.trainee_list.map(t => [
        t.name,
        t.employee_id,
        t.department,
        `${t.attendance_rate}%`,
        String(t.sessions_completed),
        t.is_compliant ? "Compliant" : "Non-Compliant",
      ]),
      theme: "striped",
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "center" },
      },
      didParseCell: (hookData) => {
        if (hookData.column.index === 5 && hookData.section === "body") {
          const val = hookData.cell.raw as string;
          hookData.cell.styles.textColor = val === "Compliant" ? [22, 163, 74] : [220, 38, 38];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 10, right: 10 },
    });

    // ── Footer ───────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Eagle Industry Training Platform  •  Page ${p} of ${totalPages}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: "center" }
      );
    }

    doc.save(`Compliance_Report_${data.site_name.replace(/\s+/g, "_")}_${now.replace(/\s+/g, "_")}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading compliance data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const filteredList = data.trainee_list.filter(t =>
    filter === "all" ? true : filter === "compliant" ? t.is_compliant : !t.is_compliant
  );

  const pieData = [
    { name: "Compliant", value: data.compliant_trainees },
    { name: "Non-Compliant", value: data.non_compliant_trainees },
  ];

  const sessionData = [
    { name: "Completed", value: data.completed_sessions },
    { name: "Pending", value: data.total_sessions - data.completed_sessions },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Report</h1>
          <p className="text-gray-600 mt-1">
            Site: <span className="font-semibold text-gray-800">{data.site_name}</span>
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className={`text-2xl font-bold mt-1 ${data.compliance_rate >= 80 ? "text-green-600" : data.compliance_rate >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                {data.compliance_rate}%
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trainees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.total_trainees}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliant</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{data.compliant_trainees}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Non-Compliant</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{data.non_compliant_trainees}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartWrapper title="Trainee Compliance Status" description="Compliant vs non-compliant trainees">
          <PieChartComponent data={pieData} />
        </ChartWrapper>
        <ChartWrapper title="Department Compliance" description="Compliance rate by department">
          <BarChartComponent data={data.department_compliance} dataKey="value" fill="#f97316" />
        </ChartWrapper>
      </div>

      {/* Trainee Compliance Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" /> Trainee Compliance Detail
          </h3>
          <div className="flex gap-2">
            {(["all", "compliant", "non_compliant"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f === "compliant" ? "Compliant" : "Non-Compliant"}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Employee ID</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Department</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Attendance</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Sessions</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{t.name}</td>
                  <td className="py-3 px-3 text-gray-500">{t.employee_id}</td>
                  <td className="py-3 px-3 text-gray-500">{t.department}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-semibold ${t.attendance_rate >= 75 ? "text-green-600" : "text-red-600"}`}>
                      {t.attendance_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700">{t.sessions_completed}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      t.is_compliant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {t.is_compliant ? "Compliant" : "Non-Compliant"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No trainees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientCompliance;
