import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScrollableChart from "@/components/shared/ScrollableChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TraineePerformanceRow {
  trainee_id: string;
  full_name: string;
  department: string;
  site: string;
  sessions_enrolled: number;
  attendance_rate: number;
  avg_quiz_score: number;
  quiz_pass_rate: number;
  certificates_earned: number;
  trainer_evaluation: number | null;
  composite_score: number;
  rank: number;
}

interface TrainerTraineePerformanceResponse {
  trainer_id: string;
  total_trainees: number;
  trainees: TraineePerformanceRow[];
}

export default function TrainerTraineePerformance() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["trainer-trainee-performance", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await apiGet<TrainerTraineePerformanceResponse>(
        `/api/trainer/${user?.id}/trainees/performance/`
      );
      return res;
    },
  });

  if (isLoading) return <div className="p-6">Loading trainee performance...</div>;

  const trainees = data?.trainees || [];

  const getMedal = (rank: number) => {
    if (rank === 1) return "#1";
    if (rank === 2) return "#2";
    if (rank === 3) return "#3";
    return `#${rank}`;
  };

  const getScoreColor = (score: number) =>
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-500";

  const avgAttendance =
    trainees.length > 0
      ? Math.round(trainees.reduce((s, t) => s + t.attendance_rate, 0) / trainees.length)
      : 0;

  const avgQuizScore =
    trainees.length > 0
      ? Math.round(trainees.reduce((s, t) => s + t.avg_quiz_score, 0) / trainees.length)
      : 0;

  const totalCertificates = trainees.reduce((s, t) => s + t.certificates_earned, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainee Performance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Performance of trainees enrolled in your sessions · {trainees.length} trainees
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Total Trainees</p>
            <p className="text-3xl font-bold text-blue-600">{trainees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Avg Attendance</p>
            <p className="text-3xl font-bold text-green-600">{avgAttendance}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Avg Quiz Score</p>
            <p className="text-3xl font-bold text-purple-600">{avgQuizScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Certificates Issued</p>
            <p className="text-3xl font-bold text-amber-600">{totalCertificates}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trainee Ranking by Composite Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollableChart
            itemCount={trainees.length}
            itemWidth={85}
            minWidth={400}
            height={260}
            title=""
          >
            {(width) => (
              <BarChart
                width={width}
                height={260}
                data={trainees}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="trainee_id"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Composite Score"]}
                  labelFormatter={(label) => `Trainee: ${label}`}
                />
                <Bar dataKey="composite_score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ScrollableChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Performance Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Rank</th>
                  <th className="pb-2 pr-4">Trainee ID</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Dept</th>
                  <th className="pb-2 pr-4">Attendance</th>
                  <th className="pb-2 pr-4">Quiz Score</th>
                  <th className="pb-2 pr-4">Pass Rate</th>
                  <th className="pb-2 pr-4">Certs</th>
                  <th className="pb-2 pr-4">Eval</th>
                  <th className="pb-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {trainees.map((t) => (
                  <tr key={t.trainee_id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-bold text-lg">{getMedal(t.rank)}</td>
                    <td className="py-2 pr-4 font-mono text-xs bg-gray-100 rounded px-1">
                      {t.trainee_id}
                    </td>
                    <td className="py-2 pr-4 font-medium">{t.full_name}</td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{t.department}</td>
                    <td className="py-2 pr-4">
                      <span className={getScoreColor(t.attendance_rate)}>
                        {t.attendance_rate}%
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={getScoreColor(t.avg_quiz_score)}>
                        {t.avg_quiz_score}%
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={getScoreColor(t.quiz_pass_rate)}>
                        {t.quiz_pass_rate}%
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-center">{t.certificates_earned}</td>
                    <td className="py-2 pr-4">
                      {t.trainer_evaluation !== null ? (
                        <span className={getScoreColor(t.trainer_evaluation * 10)}>
                          {t.trainer_evaluation}/10
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Badge
                        className={
                          t.composite_score >= 80
                            ? "bg-green-100 text-green-700"
                            : t.composite_score >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {t.composite_score}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
