
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BadgeCheck, Download, Calendar, PlaySquare, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet } from "@/api/axios";

export default function TraineeCompletedSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    apiGet<any[]>(`/api/trainee/${user.id}/completed/`)
      .then(setCompletedSessions)
      .catch(() => toast.error("Failed to fetch completed sessions"))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading completed sessions...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Completed Sessions</h1>
          <p className="text-slate-500 mt-1">Review your past training and download certificates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedSessions.length > 0 ? completedSessions.map((session, i) => (
          <Card key={i} className="flex flex-col p-6 shadow-sm border-none ring-1 ring-slate-200 hover:ring-blue-300 hover:shadow-md transition-all group bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                session.attended ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}>
                {session.attended ? "Attended" : "Completed Task"}
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{session.title}</h3>
              <p className="text-sm text-slate-500 mb-2 line-clamp-1">{session.course}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-4">
                <Calendar className="w-4 h-4 text-slate-400" /> {session.date}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex flex-col gap-2">
              {session.attended && !session.feedback_given && !session.feedback_submitted ? (
                <>
                  <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Feedback Required
                  </div>
                  <Button
                    onClick={() => navigate(`/trainee/feedback`)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Provide Mandatory Feedback
                  </Button>
                </>
              ) : (
                <div className="flex gap-2 w-full items-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    session.attended
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {session.attended ? "✓ Attended" : "Absent"}
                  </span>
                  {(session.feedback_given || session.feedback_submitted) && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      ✓ Feedback Given
                    </span>
                  )}
                  {session.certificate_id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => navigate(`/trainee/certificates`)}
                    >
                      <Download className="w-4 h-4 mr-1" /> Certificate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        )) : <p className="text-slate-500 col-span-3 text-center">No completed sessions found.</p>}
      </div>
    </div>
  );
}

