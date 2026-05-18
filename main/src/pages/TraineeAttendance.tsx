
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, UserCheck, XCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet } from "@/api/axios";

export default function TraineeAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    apiGet(`/api/trainee/${user.id}/attendance/`)
      .then(setData)
      .catch(() => toast.error("Failed to fetch attendance data"))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading attendance data...</div>;
  }

  const attendanceRate = data?.attendanceRate || 0;
  const history = data?.history || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Tracker</h1>
          <p className="text-slate-500 mt-1">Monitor your participation across mandatory sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 p-6 border-none shadow-sm ring-1 ring-slate-200 bg-white flex flex-col justify-center text-center">
          <div className="mx-auto w-32 h-32 rounded-full border-8 flex items-center justify-center mb-4 transition-all duration-1000 border-blue-500 bg-blue-50">
            <span className="text-3xl font-bold text-slate-900">{attendanceRate}%</span>
          </div>
          <h3 className="font-bold text-lg text-slate-800">Overall Rate</h3>
          <p className="text-slate-500 text-sm mt-1">
            {data?.attended || 0} attended out of {data?.totalEnrolled || 0} enrolled sessions.
          </p>
        </Card>

        <Card className="col-span-1 md:col-span-2 p-6 border-none shadow-sm ring-1 ring-slate-200 bg-white">
          <h3 className="font-semibold text-lg text-slate-800 mb-6">Recent Records</h3>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No attendance records yet.</p>
            ) : history.map((record: any, i: number) => {
              const isPresent = ["PRESENT", "LATE"].includes((record.status || "").toUpperCase());
              const statusLabel = record.status === "LATE" ? "Late" : isPresent ? "Present" : "Absent";
              return (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPresent ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}>
                    {isPresent ? <UserCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{record.session}</h4>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {record.display_date || record.date}</span>
                      {record.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {record.time}</span>}
                      {record.location && <span className="text-slate-400">{record.location}</span>}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full w-fit ${
                  record.status === "LATE" ? "bg-amber-50 text-amber-700" :
                  isPresent ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {statusLabel}
                </div>
              </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
