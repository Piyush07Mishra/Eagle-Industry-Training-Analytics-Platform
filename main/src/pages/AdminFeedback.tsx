import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Star, Search, MessageSquare, Loader2 } from "lucide-react";
import { apiGet } from "@/api/axios";

interface FeedbackItem {
  id: number;
  session: number;
  session_title: string;
  trainee_name: string;
  trainer_name: string;
  trainer_rating: number;
  content_rating: number;
  venue_rating: number;
  overall_rating: number;
  comments: string;
  submitted_at: string;
}

interface FeedbackSummary {
  total: number;
  avg_overall: number;
  avg_trainer: number;
  avg_content: number;
  feedbacks: FeedbackItem[];
}

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
    ))}
    <span className="ml-1 text-sm font-medium text-gray-700">{rating}/5</span>
  </div>
);

const AdminFeedback: React.FC = () => {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "highest" | "lowest">("latest");

  useEffect(() => {
    apiGet<FeedbackSummary>("/api/admin/feedback-summary/")
      .then((d) => { setSummary(d); setLoading(false); })
      .catch(() => { setError("Failed to load feedback."); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
      <span className="text-gray-600">Loading feedback...</span>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!summary) return null;

  const filtered = summary.feedbacks
    .filter((f) => {
      const q = searchTerm.toLowerCase();
      return (
        f.trainee_name.toLowerCase().includes(q) ||
        f.trainer_name.toLowerCase().includes(q) ||
        (f.comments || "").toLowerCase().includes(q) ||
        f.session_title.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "highest") return b.overall_rating - a.overall_rating;
      if (sortBy === "lowest") return a.overall_rating - b.overall_rating;
      return new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
        <p className="text-gray-600 mt-1">View and manage all feedback submissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Total Feedback</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Avg Overall</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <p className="text-2xl font-bold text-yellow-600">{summary.avg_overall}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Avg Trainer Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
            <p className="text-2xl font-bold text-blue-600">{summary.avg_trainer}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 font-medium">Avg Content Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 text-green-400 fill-green-400" />
            <p className="text-2xl font-bold text-green-600">{summary.avg_content}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by trainee, trainer, session or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="latest">Latest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No feedback found</p>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{f.trainee_name}</p>
                    <span className="text-gray-400 text-sm">→</span>
                    <p className="text-sm text-gray-600">Session: <span className="font-medium text-gray-800">{f.session_title}</span></p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Trainer: {f.trainer_name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Trainer</p>
                      <StarDisplay rating={f.trainer_rating} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Content</p>
                      <StarDisplay rating={f.content_rating} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Venue</p>
                      <StarDisplay rating={f.venue_rating} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Overall</p>
                      <StarDisplay rating={f.overall_rating} />
                    </div>
                  </div>
                  {f.comments && (
                    <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg italic">"{f.comments}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    f.overall_rating >= 4 ? "bg-green-100 text-green-700" :
                    f.overall_rating >= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {f.overall_rating >= 4 ? "Positive" : f.overall_rating >= 3 ? "Neutral" : "Negative"}
                  </span>
                  {f.submitted_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(f.submitted_at).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
