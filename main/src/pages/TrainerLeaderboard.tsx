import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, Award } from "lucide-react";
import { apiGet } from "@/api/axios";
import ScrollableChart from "@/components/shared/ScrollableChart";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface LeaderboardEntry {
  rank: number;
  trainer_id: string;
  is_current: boolean;
  score: number;
  sessions_count: number;
  completion_rate: number;
  avg_rating: number;
  trainees_count: number;
  breakdown: {
    sessions: number;
    completion: number;
    rating: number;
    trainees: number;
    feedback: number;
  };
}

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const RANK_BG = [
  "bg-yellow-50 border-yellow-200",
  "bg-gray-50 border-gray-200",
  "bg-amber-50 border-amber-200",
];

const TrainerLeaderboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<LeaderboardEntry[]>("/api/trainer/leaderboard/")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load leaderboard."); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leaderboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const top3 = data.slice(0, 3);
  const currentEntry = data.find((e) => e.is_current);

  const scoreChartData = data.map((entry) => ({
    trainer_id: entry.trainer_id,
    score: entry.score,
  }));

  const radarData = currentEntry
    ? [
        { subject: "Sessions", value: currentEntry.breakdown.sessions },
        { subject: "Completion", value: currentEntry.breakdown.completion },
        { subject: "Rating", value: currentEntry.breakdown.rating },
        { subject: "Trainees", value: currentEntry.breakdown.trainees },
        { subject: "Feedback", value: currentEntry.breakdown.feedback },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trainer Leaderboard</h1>
        <p className="text-gray-600 mt-1">
          Anonymous ranking by composite score — trainer IDs only
        </p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((entry, idx) => (
            <Card
              key={entry.trainer_id}
              className={`p-6 border-2 ${RANK_BG[idx] || "bg-white"} ${entry.is_current ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`text-5xl mb-2 ${RANK_COLORS[idx] || "text-gray-700"}`}>
                  {idx === 0 ? (
                    <Trophy className="w-12 h-12 mx-auto" />
                  ) : (
                    <Medal className="w-10 h-10 mx-auto" />
                  )}
                </div>
                <span className={`text-2xl font-black ${RANK_COLORS[idx] || "text-gray-700"}`}>
                  #{entry.rank}
                </span>
                <div className="mt-2 flex items-center gap-2 justify-center">
                  <p className="font-semibold text-gray-900 text-lg font-mono">{entry.trainer_id}</p>
                  {entry.is_current && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                      YOU
                    </span>
                  )}
                </div>
                <div className="mt-4 w-full space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score</span>
                    <span className="font-bold text-gray-900">{entry.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-semibold text-blue-600">{entry.sessions_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Rating</span>
                    <span className="font-semibold text-yellow-600">{entry.avg_rating}★</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-semibold text-green-600">{entry.completion_rate}%</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Current Trainer Radar Chart */}
      {currentEntry && radarData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" /> Your Performance Breakdown
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Radar chart for <span className="font-mono font-semibold">{currentEntry.trainer_id}</span> — Rank #{currentEntry.rank}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar
                  name="You"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                />
                <Tooltip formatter={(v: number) => `${v}/100`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Leaderboard Score Chart */}
      {scoreChartData.length > 0 && (
        <Card className="p-6">
          <ScrollableChart
            itemCount={scoreChartData.length}
            itemWidth={90}
            minWidth={400}
            height={260}
            title="Trainer Composite Scores"
          >
            {(width) => (
              <BarChart
                width={width}
                height={260}
                data={scoreChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="trainer_id"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}`} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ScrollableChart>
        </Card>
      )}

      {/* Full Rankings Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Trainer ID</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Score</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Sessions</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Completion</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Avg Rating</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Trainees</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr
                  key={entry.trainer_id}
                  className={`border-b border-gray-100 transition-colors ${
                    entry.is_current
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-3">
                    <span className={`font-bold ${entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "text-gray-600"}`}>
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">{entry.trainer_id}</span>
                      {entry.is_current && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">{entry.score}</td>
                  <td className="py-3 px-3 text-right text-blue-600">{entry.sessions_count}</td>
                  <td className="py-3 px-3 text-right text-green-600">{entry.completion_rate}%</td>
                  <td className="py-3 px-3 text-right text-yellow-600">{entry.avg_rating}★</td>
                  <td className="py-3 px-3 text-right text-purple-600">{entry.trainees_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Star className="w-8 h-8 mx-auto mb-2" />
              <p>No leaderboard data yet.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Score Formula */}
      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Score Formula</p>
            <p className="text-blue-700 text-sm mt-0.5">
              Composite score = (Avg Rating × 20 × 0.4) + (Completion Rate × 0.4) + (Trainees × 0.4).
              Trainer IDs are shown instead of names to ensure fair, anonymous comparison.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrainerLeaderboard;
