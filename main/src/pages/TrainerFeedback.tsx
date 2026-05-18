import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Send, Loader2, MessageSquare, User } from "lucide-react";
import { apiGet, apiPost } from "@/api/axios";
import { toast } from "sonner";

interface FeedbackReceived {
  id: number;
  session_title: string;
  trainee_name: string;
  trainer_rating: number;
  content_rating: number;
  venue_rating: number;
  overall_rating: number;
  comments: string;
  submitted_at: string;
}

interface TrainerSession {
  id: number;
  title: string;
  course_title: string;
  start_time: string;
  status: string;
}

interface TraineePending {
  id: number;
  name: string;
  employee_id: string;
}

interface FeedbackSummary {
  received: FeedbackReceived[];
  avg_rating: number;
  total_feedback: number;
}

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            s <= (hovered || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
        />
      ))}
    </div>
  );
};

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
    ))}
    <span className="ml-1 text-sm font-medium text-gray-700">{rating}/5</span>
  </div>
);

const TrainerFeedback: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"received" | "submit">("received");
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [trainees, setTrainees] = useState<TraineePending[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [scores, setScores] = useState({ discipline: 8, aptitude: 8, participation: 8, attendance: 8, understanding: 8, overall: 8 });
  const [comments, setComments] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGet<FeedbackSummary>("/api/trainer/feedback-received/"),
      apiGet<TrainerSession[]>("/api/trainer/sessions/"),
    ]).then(([fb, sess]) => {
      setSummary(fb);
      setSessions(sess);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedSession) {
      apiGet<TraineePending[]>(`/api/trainer/sessions/${selectedSession}/trainees/`)
        .then(setTrainees)
        .catch(() => setTrainees([]));
    }
  }, [selectedSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !selectedTrainee) {
      toast.error("Please select a session and trainee");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/trainer-feedback/", {
        session: parseInt(selectedSession),
        trainee: parseInt(selectedTrainee),
        ...scores,
        discipline_score: scores.discipline,
        aptitude_score: scores.aptitude,
        participation_score: scores.participation,
        attendance_score: scores.attendance,
        understanding_score: scores.understanding,
        overall_score: scores.overall,
        comments,
        recommendations,
      });
      toast.success("Trainee evaluation submitted!");
      setSelectedTrainee("");
      setComments("");
      setRecommendations("");
      setScores({ discipline: 8, aptitude: 8, participation: 8, attendance: 8, understanding: 8, overall: 8 });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
      <span className="text-gray-600">Loading...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
        <p className="text-gray-600 mt-1">View feedback from trainees and submit trainee evaluations</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Feedback Received</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summary?.total_feedback || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <p className="text-2xl font-bold text-yellow-600">{summary?.avg_rating || "—"}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["received", "submit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "received" ? "Feedback Received" : "Evaluate Trainee"}
          </button>
        ))}
      </div>

      {/* Received Feedback */}
      {activeTab === "received" && (
        <div className="space-y-3">
          {!summary?.received?.length ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No feedback received yet</p>
            </Card>
          ) : (
            summary.received.map((f) => (
              <Card key={f.id} className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {f.trainee_name}
                    </p>
                    <p className="text-sm text-gray-500">{f.session_title}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {f.submitted_at && new Date(f.submitted_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div><p className="text-xs text-gray-500 mb-1">Trainer</p><StarDisplay rating={f.trainer_rating} /></div>
                  <div><p className="text-xs text-gray-500 mb-1">Content</p><StarDisplay rating={f.content_rating} /></div>
                  <div><p className="text-xs text-gray-500 mb-1">Venue</p><StarDisplay rating={f.venue_rating} /></div>
                  <div><p className="text-xs text-gray-500 mb-1">Overall</p><StarDisplay rating={f.overall_rating} /></div>
                </div>
                {f.comments && (
                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg italic">"{f.comments}"</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Submit Evaluation */}
      {activeTab === "submit" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluate Trainee</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session</label>
                <select
                  value={selectedSession}
                  onChange={(e) => { setSelectedSession(e.target.value); setSelectedTrainee(""); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.title || s.course_title} — {new Date(s.start_time).toLocaleDateString("en-IN")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trainee</label>
                <select
                  value={selectedTrainee}
                  onChange={(e) => setSelectedTrainee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedSession}
                >
                  <option value="">{selectedSession ? "Select trainee" : "Select session first"}</option>
                  {trainees.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Score sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { key: "discipline", label: "Discipline" },
                { key: "aptitude", label: "Aptitude" },
                { key: "participation", label: "Participation" },
                { key: "attendance", label: "Attendance" },
                { key: "understanding", label: "Understanding" },
                { key: "overall", label: "Overall" },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    <span className="text-sm font-bold text-blue-600">{scores[key]}/10</span>
                  </div>
                  <input
                    type="range" min={1} max={10}
                    value={scores[key]}
                    onChange={(e) => setScores(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="General comments about the trainee..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Recommendations</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Areas for improvement or next steps..."
              />
            </div>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default TrainerFeedback;
