import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/api/axios";

interface RatingQuestion {
  key: string;
  label: string;
  description: string;
}

const RATING_QUESTIONS: RatingQuestion[] = [
  {
    key: "trainer_knowledge_rating",
    label: "Trainer Knowledge",
    description: "How well did the trainer know the subject matter?",
  },
  {
    key: "trainer_communication_rating",
    label: "Trainer Communication",
    description: "How clearly did the trainer explain concepts?",
  },
  {
    key: "trainer_engagement_rating",
    label: "Trainer Engagement",
    description: "How engaging and interactive was the trainer?",
  },
  {
    key: "content_relevance_rating",
    label: "Content Relevance",
    description: "How relevant was the content to your role?",
  },
  {
    key: "content_clarity_rating",
    label: "Content Clarity",
    description: "How clear and well-organized was the material?",
  },
  {
    key: "overall_rating",
    label: "Overall Experience",
    description: "Your overall rating for this session.",
  },
  {
    key: "venue_rating",
    label: "Venue / Platform",
    description: "Rating for the physical venue or online platform.",
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-100 text-slate-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-amber-600 font-semibold ml-2 self-center">
          {value}/5
        </span>
      )}
    </div>
  );
}

export default function TraineeFeedback() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Ratings state keyed by question key
  const [ratings, setRatings] = useState<Record<string, number>>({
    trainer_knowledge_rating: 0,
    trainer_communication_rating: 0,
    trainer_engagement_rating: 0,
    content_relevance_rating: 0,
    content_clarity_rating: 0,
    overall_rating: 0,
    venue_rating: 0,
  });
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [bestPart, setBestPart] = useState("");
  const [improvementSuggestion, setImprovementSuggestion] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    apiGet<any[]>("/api/trainee/upcoming/")
      .then((data) => {
        // Only sessions that are completed or ongoing are eligible for feedback
        const eligible = (data || []).filter(
          (s: any) => s.status === "COMPLETED" || s.status === "ONGOING"
        );
        setSessions(eligible);
        if (eligible.length > 0) setSelectedSession(String(eligible[0].id));
      })
      .catch(() => toast.error("Failed to load sessions"))
      .finally(() => setIsLoading(false));
  }, []);

  const allRated = RATING_QUESTIONS.every((q) => (ratings[q.key] || 0) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) {
      toast.error("Please select a session.");
      return;
    }
    if (!allRated) {
      toast.error("Please rate all categories before submitting.");
      return;
    }
    if (wouldRecommend === null) {
      toast.error("Please answer the recommendation question.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(`/api/trainee/sessions/${selectedSession}/feedback/`, {
        ...ratings,
        trainer_rating: ratings.trainer_knowledge_rating,
        content_rating: ratings.content_relevance_rating,
        would_recommend: wouldRecommend,
        best_part: bestPart,
        improvement_suggestion: improvementSuggestion,
        comments,
      });
      toast.success("Thank you! Your feedback has been submitted.");
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || "Failed to submit feedback";
      toast.error(msg.includes("already") ? "You have already submitted feedback for this session." : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading sessions...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Star className="w-10 h-10 text-green-600 fill-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Feedback Submitted!</h2>
        <p className="text-gray-600">Thank you for helping us improve our training quality.</p>
        <Button onClick={() => setSubmitted(false)} variant="outline">Submit Another</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Session Feedback</h1>
        <p className="text-slate-500 mt-1">
          Your honest feedback helps us improve training quality for everyone.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-slate-500">No completed sessions available for feedback yet.</p>
        </Card>
      ) : (
        <Card className="p-8 shadow-sm border-none ring-1 ring-slate-200 bg-white">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Session selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {new Date(s.start_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* 7 Star Rating Questions */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Rate Each Category</h3>
              {RATING_QUESTIONS.map((q) => (
                <div key={q.key} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{q.label}</p>
                      <p className="text-xs text-gray-500">{q.description}</p>
                    </div>
                    <StarRating
                      value={ratings[q.key] || 0}
                      onChange={(v) => setRatings((prev) => ({ ...prev, [q.key]: v }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Would Recommend */}
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-3">
                Would you recommend this session to colleagues?
              </h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recommend"
                    checked={wouldRecommend === true}
                    onChange={() => setWouldRecommend(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-green-700">Yes, definitely</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recommend"
                    checked={wouldRecommend === false}
                    onChange={() => setWouldRecommend(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-red-600">No, not really</span>
                </label>
              </div>
            </div>

            {/* Best Part */}
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                What was the best part of this session?
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-y transition-all"
                placeholder="The hands-on exercises were very helpful..."
                value={bestPart}
                onChange={(e) => setBestPart(e.target.value)}
              />
            </div>

            {/* Improvement */}
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                What could be improved?
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-y transition-all"
                placeholder="More real-world examples would help..."
                value={improvementSuggestion}
                onChange={(e) => setImprovementSuggestion(e.target.value)}
              />
            </div>

            {/* General comments */}
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                Any other comments?
              </label>
              <textarea
                className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-y transition-all"
                placeholder="Overall a great experience..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-xl text-base flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Feedback</>
              )}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
