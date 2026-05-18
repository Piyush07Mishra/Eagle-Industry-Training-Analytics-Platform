import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, BookOpen, Clock, Activity, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiGet } from "@/api/axios";

export default function TraineeReportCard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    apiGet(`/api/trainee/${user.id}/report-card/`)
      .then(setData)
      .catch(() => toast.error("Failed to fetch report card data"))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your report card...</div>;
  }
  
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          My Report Card
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          Comprehensive performance evaluation based on your attendance, quizzes, and trainer feedbacks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md overflow-hidden border border-slate-100 bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          <CardHeader className="flex flex-row items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-800">Score Analysis</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Average across {data.score_analysis?.total_quizzes_taken || 0} quizzes</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-extrabold text-slate-900">{data.score_analysis?.overall_percentage || 0}%</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${data.score_analysis?.performance_level === "Excellent" ? "bg-green-100 text-green-700" :
                data.score_analysis?.performance_level === "Good" ? "bg-blue-100 text-blue-700" :
                "bg-orange-100 text-orange-800"}
              `}>
                {data.score_analysis?.performance_level || "N/A"}
              </span>
            </div>
            <Progress value={data.score_analysis?.overall_percentage || 0} className="h-2 mb-6" />
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Recommendation to Improve
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{data.score_analysis?.general_recommendation || "Maintain consistent effort and keep attending sessions."}"
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md overflow-hidden border border-slate-100 bg-white relative flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
          <CardHeader className="flex flex-row items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-800">Attendance Record</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Participation across enrolled sessions</p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-center pb-8">
            <div className="flex justify-around mb-8 items-center text-center">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800">{data.attendance?.attended || 0}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Attended</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800">{data.attendance?.total_enrolled || 0}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Enrolled</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-teal-600">{data.attendance?.rate || 0}%</span>
                <span className="text-[10px] uppercase font-bold text-teal-600/60 mt-1 tracking-wider">Rate</span>
              </div>
            </div>
            <Progress value={data.attendance?.rate || 0} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2 text-slate-800">
        <BookOpen className="w-5 h-5 text-blue-500" />
        Quiz & Assessment Results
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {data.quiz_scores?.length > 0 ? (
          data.quiz_scores.map((quiz: any, idx: number) => (
            <Card key={idx} className="border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 h-full w-1.5" style={{backgroundColor: quiz.passed ? '#22c55e' : '#ef4444'}}></div>
              <CardContent className="p-5 flex flex-col justify-between h-full gap-5">
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{quiz.quiz_title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Completed on {new Date(quiz.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold shrink-0 ${quiz.passed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {quiz.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
                
                <div>
                   <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-600">
                      <span>Score: {quiz.score} / {quiz.total_score}</span>
                      <span>{quiz.percentage}%</span>
                   </div>
                   <Progress value={quiz.percentage} className="h-1.5 mb-4" />
                   
                   {quiz.recommendations && (
                     <div className="bg-blue-50/70 p-3.5 rounded-lg text-xs leading-relaxed text-blue-800 border border-blue-100/50 mt-2">
                       <span className="font-bold block mb-1 text-blue-900 flex items-center gap-1.5">
                         <Activity className="w-3 h-3"/> Tips:
                       </span>
                       {quiz.recommendations}
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            No quiz results available yet. Take some tests to see your scores here.
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2 text-slate-800">
        <Award className="w-5 h-5 text-purple-500" />
        Trainer Evaluations
      </h2>
      <div className="grid gap-4">
        {data.trainer_feedbacks?.length > 0 ? (
           data.trainer_feedbacks.map((fb: any, idx: number) => (
             <Card key={idx} className="border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                <CardContent className="p-5 md:p-7">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{fb.trainer}</h4>
                      <p className="text-sm font-semibold text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded mt-1">{fb.session}</p>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium uppercase tracking-wider">Evaluated on {fb.date}</p>
                    </div>
                    <div className="flex gap-4 sm:gap-6 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center justify-center shrink-0">
                       <div className="text-center px-1">
                         <div className="text-lg font-bold text-slate-800">{fb.attendance_score}</div>
                         <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Attend</div>
                       </div>
                       <div className="w-px h-8 bg-slate-200"></div>
                       <div className="text-center px-1">
                         <div className="text-lg font-bold text-slate-800">{fb.participation_score}</div>
                         <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Partic</div>
                       </div>
                       <div className="w-px h-8 bg-slate-200"></div>
                       <div className="text-center px-1">
                         <div className="text-lg font-bold text-slate-800">{fb.understanding_score}</div>
                         <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Underst</div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Trainer's Comments</h5>
                      <p className="text-sm text-slate-700 leading-relaxed">{fb.comment}</p>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-2">Actionable Feedback</h5>
                      <p className="text-sm text-purple-800 italic leading-relaxed">{fb.recommendations || "Keep up the good work."}</p>
                    </div>
                  </div>
                </CardContent>
             </Card>
           ))
        ) : (
          <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            No trainer evaluations available yet.
          </div>
        )}
      </div>
    </div>
  );
}
