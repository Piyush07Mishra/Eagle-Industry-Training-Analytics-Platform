import React, { useEffect, useState } from "react";
import { BookOpen, MapPin, Video, User, PlusCircle, QrCode, Users, Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/api/axios";

export default function TraineeAvailableSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  const fetchAvailableSessions = () => {
    if (!user?.id) return;
    setIsLoading(true);
    apiGet<any[]>(`/api/trainee/${user.id}/available-sessions/`)
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to fetch available sessions"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAvailableSessions();
  }, [user?.id]);

  const handleEnroll = (sessionId: string) => {
    if (!user?.id) return;
    setIsEnrolling(sessionId);
    apiPost(`/api/trainee/${user.id}/enroll/${sessionId}/`, {})
      .then((data: any) => {
        if (data?.already_enrolled) {
          toast.info("You are already enrolled in this session.");
        } else {
          toast.success(data?.message || "Successfully enrolled!");
        }
        // Remove from available list immediately
        setSessions(prev => prev.filter(s => String(s.id) !== String(sessionId)));
      })
      .catch(() => toast.error("Failed to enroll. Please try again."))
      .finally(() => setIsEnrolling(null));
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading available sessions...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800">Available Sessions</h1>
          <p className="text-slate-500 mt-1">Browse and enroll in upcoming training sessions</p>
        </div>
        <Button
          onClick={() => navigate("/enroll/scan")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <QrCode className="w-4 h-4" />
          Scan QR to Enroll
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-12 text-center border-none shadow-sm ring-1 ring-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-700">No New Sessions Available</h3>
          <p className="text-slate-500 mt-2">
            You are enrolled in all currently offered sessions, or no new sessions are scheduled.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const isFull = session.is_full || session.seats_remaining === 0;
            return (
              <Card
                key={session.id}
                className={`p-6 border-none shadow-sm ring-1 hover:shadow-md transition-all overflow-hidden relative bg-white ${
                  isFull ? "ring-slate-200 opacity-75" : "ring-slate-200 hover:ring-blue-200"
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isFull ? "bg-slate-300" : "bg-blue-500"}`} />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                  {/* Left: Session info */}
                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-800">
                          {session.course_title || session.title || session.course}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          session.session_type === "ONLINE"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}>
                          {session.session_type || session.type}
                        </span>
                        {isFull && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                            Full
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      {(session.trainer_name || session.trainer_id) && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {session.trainer_name || session.trainer_id}
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {session.location}
                        </div>
                      )}
                      {session.session_type === "ONLINE" && session.meeting_link && (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <Video className="w-4 h-4" />
                          Online Session
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className={isFull ? "text-red-500 font-medium" : ""}>
                          {session.enrolled_count ?? "—"}/{session.max_trainees ?? "—"} enrolled
                          {!isFull && session.seats_remaining !== undefined && (
                            <span className="text-amber-600 ml-1">({session.seats_remaining} left)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date + Enroll */}
                  <div className="flex flex-col md:items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-1.5 md:justify-end text-slate-700 font-bold">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-1.5 md:justify-end text-slate-500 text-sm mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {session.time}
                      </div>
                    </div>
                    <Button
                      className={`w-full md:w-auto ${isFull ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                      onClick={() => !isFull && handleEnroll(String(session.id))}
                      disabled={isEnrolling === String(session.id) || isFull}
                    >
                      {isEnrolling === String(session.id) ? (
                        "Enrolling..."
                      ) : isFull ? (
                        "Session Full"
                      ) : (
                        <><PlusCircle className="w-4 h-4 mr-2" />Enroll Now</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
