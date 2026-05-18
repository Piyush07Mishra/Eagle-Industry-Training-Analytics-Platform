import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, ArrowRight, CheckCircle, Circle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/api/axios";
import { toast } from "sonner";

type Progress = "NOT_STARTED" | "BEGIN" | "MID" | "COMPLETED";

interface SessionItem {
  id: number;
  title: string;
  course_title: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string;
  meeting_link?: string;
  location: string;
  trainer_name: string;
  progress: Progress;
  is_past: boolean;
}

const PROGRESS_STEPS: { key: Progress; label: string }[] = [
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "BEGIN", label: "Begin" },
  { key: "MID", label: "Mid-way" },
  { key: "COMPLETED", label: "Completed" },
];

const NEXT_PROGRESS: Record<Progress, Progress | null> = {
  NOT_STARTED: "BEGIN",
  BEGIN: "MID",
  MID: "COMPLETED",
  COMPLETED: null,
};

function ProgressStepper({
  sessionId,
  progress,
  onUpdate,
}: {
  sessionId: number;
  progress: Progress;
  onUpdate: (p: Progress) => void;
}) {
  const [updating, setUpdating] = useState(false);

  const stepIdx = PROGRESS_STEPS.findIndex((s) => s.key === progress);
  const next = NEXT_PROGRESS[progress];

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try {
      await apiPost(`/api/trainee/sessions/${sessionId}/progress/`, { progress: next });
      onUpdate(next);
      toast.success(`Progress updated: ${next.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update progress");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {/* Step dots */}
      <div className="flex items-center gap-1">
        {PROGRESS_STEPS.map((step, i) => {
          const done = i <= stepIdx;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`flex flex-col items-center`}
                style={{ minWidth: 48 }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                    done
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-1 text-center ${done ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-4 ${i < stepIdx ? "bg-blue-600" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {next && (
        <Button
          size="sm"
          onClick={advance}
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          {updating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Mark as {next.replace("_", " ")}
        </Button>
      )}
      {!next && (
        <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Session Completed
        </span>
      )}
    </div>
  );
}

export default function TraineeUpcomingSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = () => {
    setIsLoading(true);
    apiGet<SessionItem[]>("/api/trainee/upcoming/")
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load sessions");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
    // Refetch when tab regains focus — picks up new enrollments from QR flow
    const onFocus = () => fetchSessions();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const updateProgress = (sessionId: number, newProgress: Progress) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, progress: newProgress } : s))
    );
  };

  const now = new Date();

  const canJoin = (session: SessionItem) => {
    if (session.session_type !== "ONLINE") return false;
    const start = new Date(session.start_time);
    const diff = (start.getTime() - now.getTime()) / 60000; // minutes
    return diff <= 30; // allow joining 30 minutes before
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading upcoming sessions...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Upcoming Sessions</h1>
        <p className="text-slate-500 mt-1">Track your enrolled sessions and update your progress.</p>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-slate-500">No sessions found. Enroll using a QR code!</p>
          </Card>
        ) : (
          sessions.map((session) => {
            const startDate = new Date(session.start_time);
            const joinable = canJoin(session);

            return (
              <Card
                key={session.id}
                className="p-0 overflow-hidden shadow-sm border-none ring-1 ring-slate-200 hover:ring-blue-300 hover:shadow-md transition-all bg-white"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Date block */}
                  <div className="bg-slate-50 md:w-40 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                      {startDate.toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="text-3xl font-bold text-slate-800">{startDate.getDate()}</span>
                    <span className="text-xs text-gray-400 mt-1">{startDate.getFullYear()}</span>
                    <span
                      className={`mt-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        session.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : session.status === "ONGOING"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{session.title}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          session.session_type === "ONLINE"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {session.session_type}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm">
                      {session.course_title} · Trainer:{" "}
                      <span className="font-medium text-slate-700">{session.trainer_name || "TBD"}</span>
                    </p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {session.session_type === "ONLINE" ? (
                          <Video className="w-4 h-4 text-slate-400" />
                        ) : (
                          <MapPin className="w-4 h-4 text-slate-400" />
                        )}
                        {session.location || "Online"}
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    <ProgressStepper
                      sessionId={session.id}
                      progress={session.progress}
                      onUpdate={(p) => updateProgress(session.id, p)}
                    />
                  </div>

                  {/* Join button */}
                  {session.session_type === "ONLINE" && session.meeting_link && (
                    <div className="p-6 md:w-44 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 shrink-0">
                      <Button
                        className={`w-full ${
                          joinable
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!joinable}
                        onClick={() => {
                          if (joinable) window.open(session.meeting_link, "_blank");
                        }}
                        title={
                          !joinable
                            ? `Available 30 min before: ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "Join now"
                        }
                      >
                        Join Meeting <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                      {!joinable && (
                        <p className="text-xs text-gray-400 text-center mt-1 absolute" style={{ width: 150, marginTop: 48 }}>
                          Opens 30 min before start
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
