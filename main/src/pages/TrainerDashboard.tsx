
import React, { useEffect, useState } from "react";
import { Users, BookOpen, Award, Target, TrendingUp, Calendar as CalendarIcon, Clock, Star } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/api/axios";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    activeTrainees: 0,
    trainingCompletion: 0,
    averageScore: 0,
    complianceRate: 0,
    performanceData: [],
    recentSessions: [],
    performanceIndex: 0,
    feedbackRating: 0
  });

  useEffect(() => {
    if (user?.id) {
      apiGet<any>(`/api/trainer/${user.id}/dashboard/`)
        .then(data => {
          if (data.activeTrainees !== undefined) {
            setMetrics((prev) => ({ ...prev, ...data }));
          }
        })
        .catch(e => console.error("Metrics load failed", e));
    }
  }, [user?.id]);

  const performanceData = metrics.performanceData.length ? metrics.performanceData : [
    { name: "Jan", score: 85, attendance: 90 },
    { name: "Feb", score: 88, attendance: 92 },
    { name: "Mar", score: 86, attendance: 88 },
    { name: "Apr", score: 92, attendance: 95 },
    { name: "May", score: 90, attendance: 96 },
    { name: "Jun", score: 94, attendance: 98 }
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp }: any) => (
    <Card className="p-6 border-none shadow-sm ring-1 ring-slate-200/50 bg-white">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {trend && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${trendUp ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
                <TrendingUp className={`w-3 h-3 ${!trendUp && "rotate-180"}`} />
                {trend}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Trainer Overview</h1>
        <p className="text-slate-500 mt-1">Check performance metrics and upcoming schedules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Trainees" 
          value={metrics.activeTrainees} 
          subtitle="Currently enrolled" 
          icon={Users} 
          trend="+12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Completion Rate" 
          value={`${metrics.trainingCompletion}%`} 
          subtitle="Across all courses" 
          icon={Target} 
          trend="+5.2%" 
          trendUp={true} 
        />
        <StatCard 
          title="Avg. Assessment Score" 
          value={`${metrics.averageScore}%`} 
          subtitle="Latest quizzes" 
          icon={Award} 
          trend="-2%" 
          trendUp={false} 
        />
        <StatCard 
          title="Compliance Rate" 
          value={`${metrics.complianceRate}%`} 
          subtitle="Company standard" 
          icon={BookOpen} 
          trend="+1.1%" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 shadow-sm border-none ring-1 ring-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800">Trainee Performance Trends</h3>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Trainer Performance Index</p>
              <div className="flex items-center gap-2 justify-end">
                 <h4 className="text-2xl font-bold tracking-tight text-blue-600">{metrics.performanceIndex || 0} <span className="text-sm font-normal text-slate-400">/ 100</span></h4>
                 <div className="flex items-center text-sm font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    {metrics.feedbackRating || 0}
                 </div>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Area type="monotone" dataKey="score" name="Avg Score %" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-none ring-1 ring-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800">Next Sessions</h3>
            <button 
               onClick={() => navigate('/trainer/schedule')}
               className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {metrics.recentSessions?.length ? (
               metrics.recentSessions.map((session: any, i: number) => (
                  <div key={session.id || i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-white border shadow-sm flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-rose-500">{session.month}</span>
                      <span className="text-lg font-bold text-slate-700 leading-none">{session.day}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{session.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> {session.time}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="text-center text-slate-500 mt-10">No upcoming sessions</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

