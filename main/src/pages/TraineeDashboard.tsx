
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, Clock, Award, PlayCircle, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet } from "@/api/axios";

export default function TraineeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    apiGet(`/api/trainee/${user.id}/dashboard/`)
      .then(setData)
      .catch(err => toast.error("Failed to fetch dashboard data"))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>;
  }

  const userStats = data?.stats || {
    coursesCompleted: 0,
    ongoingCourses: 0,
    upcomingSessions: 0,
    overallScore: 0
  };

  const activeCourses = data?.activeCourses || [];
  const schedule = data?.schedule || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Welcome back, {user?.name || "Trainee"}!</h1>
          <p className="text-blue-100 max-w-xl text-lg mb-6">
            You have {userStats.upcomingSessions} upcoming sessions. Keep up the great work!
          </p>
          <div className="flex gap-4">
            <Button 
              className="bg-white text-blue-700 hover:bg-slate-100 font-bold border-none shadow-md"
              onClick={() => navigate('/trainee/sessions/upcoming')}
            >
              Resume Training <PlayCircle className="ml-2 w-5 h-5"/>
            </Button>
            <Button 
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10 font-bold"
              onClick={() => navigate('/trainee/sessions/available')}
            >
              Browse New Courses <BookOpen className="ml-2 w-5 h-5"/>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Award className="w-96 h-96" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Completed Courses", value: userStats.coursesCompleted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "In Progress", value: userStats.ongoingCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Upcoming Sessions", value: userStats.upcomingSessions, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Overall Score", value: `${userStats.overallScore}%`, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 border-none shadow-sm ring-1 ring-slate-200/50 hover:shadow-md transition-shadow bg-white flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses */}
        <Card className="p-6 lg:col-span-2 shadow-sm border-none ring-1 ring-slate-200 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl text-slate-800">Current Learning Paths</h3>
            <Button variant="ghost" className="text-blue-600" onClick={() => navigate('/trainee/sessions/upcoming')}>View All</Button>
          </div>
          
          <div className="space-y-6">
            {activeCourses.length > 0 ? activeCourses.map((course: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{course.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-blue-500" /> Up next: {course.next}
                    </p>
                  </div>
                  <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2.5 bg-slate-100" indicatorcolor="bg-blue-600" />
              </div>
            )) : <p className="text-sm text-slate-500">No active courses. Enroll in a new course to get started.</p>}
          </div>
        </Card>

        {/* Schedule */}
        <Card className="p-6 shadow-sm border-none ring-1 ring-slate-200 flex flex-col bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800">Your Schedule</h3>
            <Button variant="ghost" size="icon" onClick={() => navigate('/trainee/sessions/upcoming')}><Calendar className="w-5 h-5 text-slate-500" /></Button>
          </div>
          <div className="flex-1 space-y-4">
            {schedule.length > 0 ? schedule.map((session: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex flex-col items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{session.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                    <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{session.date}</span>
                    &bull; {session.time}
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No upcoming sessions scheduled.</p>}
          </div>
          {schedule.length > 0 && <Button className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => toast.success("Joining next session...")}>Join Next Session</Button>}
        </Card>
      </div>
    </div>
  );
}

